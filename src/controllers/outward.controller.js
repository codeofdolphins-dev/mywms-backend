import { rootDB } from "../db/tenantMenager.service.js";
import { generateNo } from "../helper/generate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Op } from "sequelize";
const { models } = await rootDB();
const { Vehicle, Driver } = models;


export const allOutwardList = asyncHandler(async (req, res) => {
    const { Outward, OutwardItem, Product } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", outward_no = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const outward = await Outward.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(outward_no && { outward_no })
            },
            include: [
                {
                    model: OutwardItem,
                    as: "outwardItemList",
                    include: [
                        {
                            model: Product,
                            as: "outwardProduct"
                        }
                    ]
                }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]]
        });
        if (!outward) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = outward.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: outward.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const outwardItem = asyncHandler(async (req, res) => {
    const { Outward, OutwardItem, Product, NodeBatch, NodeBatchItems } = req.dbModels;
    try {
        const { outward_no = "" } = req.params;
        if (!outward_no) throw new Error("Outward No is required!!!");

        const outward = await Outward.findOne({
            where: { outward_no: outward_no.trim() },
            include: [
                {
                    model: OutwardItem,
                    as: "outwardItemList"
                }
            ]
        });
        if (!outward) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const jsonOutward = outward.toJSON();
        for (const item of jsonOutward.outwardItemList) {
            const nodeBatchItems = await NodeBatch.findAll({
                where: {
                    product_id: item.vendor_product_id,
                    available_qty: { [Op.gt]: 0 }
                },
                include: [
                    {
                        model: NodeBatchItems,
                        as: "batchItems"
                    }
                ]
            });
            item.nodeBatchItems = nodeBatchItems;
        }

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: outward
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const createOutward = asyncHandler(async (req, res) => {
    const { Outward, OutwardItem, Product, SalesOrder, SalesOrderItem, ManufacturingUnit } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { sales_order_id = "", store_id = "", priority = "", note = "", items = "" } = req.body;

        let total = 0;
        if ([sales_order_id, store_id].some(i => i === "")) {
            await transaction.rollback()
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };
        if (items.length <= 0) {
            await transaction.rollback()
            return res.status(400).json({ success: false, code: 400, message: "Items fields are should not be empty!!!" });
        };

        const salesOrder = await SalesOrder.findByPk(Number(sales_order_id));
        if (!salesOrder) {
            await transaction.rollback()
            return res.status(404).json({ success: false, code: 404, message: "Sales Order not found!!!" });
        };

        const store = await ManufacturingUnit.findOne({
            where: {
                id: Number(store_id),
                store_type: "fg_store"
            }
        });
        if (!store) {
            await transaction.rollback()
            return res.status(404).json({ success: false, code: 404, message: "FG Store not found!!!" });
        }

        // Step 1: Create Outward header
        const outward = await Outward.create({
            sales_order_id: salesOrder.id,

            seller_business_node_id: salesOrder.seller_business_node_id,
            ...(store_id && { store_id: store.id }),
            buyer_business_node_id: salesOrder.buyer_business_node_id,

            type: store_id ? "external" : "internal",
            priority,
            required_by: salesOrder.required_by,
            dispatch_date: new Date(),
            note,
        }, { transaction });

        outward.outward_no = generateNo("OUT", outward.id);
        await outward.save({ transaction });

        // Step 2: create outward items
        for (const item of items) {
            const { sales_order_item_id = "", vendor_product_id = "", requested_qty = "", unit_price = "" } = item;

            const product = await Product.findOne({ where: { id: Number(vendor_product_id) } });
            if (!product) {
                await transaction.rollback()
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            };

            await OutwardItem.create({
                outward_id: outward.id,
                sales_order_item_id: Number(sales_order_item_id),
                vendor_product_id: product.id,
                requested_qty: Number(requested_qty),
                unit_price: Number(unit_price),
            }, { transaction });
        };

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Created successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


const deleteOutward = asyncHandler(async (req, res) => {
    const { Outward } = req.dbModels;
    try {
        const { id = "", outward_ref = "" } = req.params;
        if (!(id || outward_ref)) return res.status(400).json({ success: false, code: 400, message: "id or outward_ref is required!!!" });

        const [isDeleted] = await Outward.destroy({ where: { [Op.or]: [{ id: parseInt(id, 10) || null }, { outward_ref }] } });
        if (isDeleted) return res.status(500).json({ success: false, code: 500, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });
    } catch (error) {
        console.log(error);
        await ransaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


const updateOutward = asyncHandler(async (req, res) => {
    const { Outward, Warehouse } = req.dbModels;
    try {
        const { id = "", outward_ref = "", host_warehouse_id = "", target_warehouse_id = "", outward_date = "", outward_type = "", vehicle_id = "", driver_id = "", status = "", note = "" } = req.body;
        if (!(id || outward_ref)) return res.status(400).json({ success: false, code: 400, message: "id or outward_ref is required!!!" });

        const isExiste = await Outward.findOne({ where: { [Op.or]: [{ id: parseInt(id, 10) || null }, { outward_ref }] } });
        if (!isExiste) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        let updateOption = {};
        if (outward_date) updateOption.outward_date = new Date(outward_date);
        if (outward_type) updateOption.outward_type = outward_type.toLowercase();
        if (status) updateOption.status = status.toLowercase();
        if (note) updateOption.note = note.toLowercase();
        if (host_warehouse_id) {
            const hostWarehouse = await Warehouse.findByPk(parseInt(host_warehouse_id, 10));
            if (!hostWarehouse) return res.status(404).json({ success: false, code: 404, message: "Host Warehouse record not found!!!" });
            updateOption.host_warehouse_id = hostWarehouse.id;
        }
        if (target_warehouse_id) {
            const targetWarehouse = await Warehouse.findByPk(parseInt(target_warehouse_id, 10));
            if (!targetWarehouse) return res.status(404).json({ success: false, code: 404, message: "Target Warehouse record not found!!!" });
            updateOption.target_warehouse_id = targetWarehouse.id;
        }
        if (vehicle_id) {
            const vehicle = await Vehicle.findByPk(parseInt(vehicle_id, 10));
            if (!vehicle) return res.status(404).json({ success: false, code: 404, message: "Vehicle not found!!!" });
            updateOption.vehicle_id = vehicle.id;
        };
        if (driver_id) {
            const driver = await Driver.findByPk(parseInt(driver_id, 10));
            if (!driver) return res.status(404).json({ success: false, code: 404, message: "Driver not found!!!" });
            updateOption.driver_id = driver.id;
        };

        const { isUpdate } = await Outward.update(
            updateOption,
            {
                where: { [Op.or]: [{ id: parseInt(id, 10) || null }, { outward_ref }] }
            }
        );
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Update successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


const updateOutwardItem = asyncHandler(async (req, res) => {
    const { Outward, OutwardItems, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id = "", barcode = "", qty = "", uom = "", rate = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const outwardItem = await OutwardItems.findByPk(parseInt(id, 10));
        if (!outwardItem) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        const outward = await Outward.findByPk(outwardItem.outward_id);
        if (!outward) return res.status(404).json({ success: false, code: 404, message: "Something wrong, parent record not found!!!" });

        let newQty = parseInt(qty, 10) || outwardItem.qty;
        let newUom = uom || outwardItem.uom;
        let newRate = parseInt(rate, 10) || outwardItem.rate;
        let newTotal = newQty * newRate;
        let old_total_amount = outwardItem.total_amount

        let updateOption = {
            qty: newQty,
            uom: newUom,
            rate: newRate,
            total_amount: newTotal
        };
        if (barcode) {
            const product = await Product.findOne({ where: { barcode } });
            if (!product) return res.status(404).json({ success: false, code: 404, message: "Product record not found!!!" });
            updateOption.barcode = barcode;
        };

        await OutwardItems.update(
            updateOption,
            {
                where: { id: parseInt(id, 10) },
                transaction
            }
        );

        outward.total = (outward.total - old_total_amount) + newTotal;
        await outward.save({ transaction });

        return res.status(200).json({ success: true, code: 200, message: "Outward item record updated successfully." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});