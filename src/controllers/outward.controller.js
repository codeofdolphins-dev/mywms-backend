import { rootDB } from "../db/tenantMenager.service.js";
import { generateNo } from "../helper/generate.js";
import { createGrn_items } from "../services/createGrn.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Op } from "sequelize";
import { getUserContext } from "../utils/getUserContext.js";
const { models } = await rootDB();
const { Vehicle, Driver } = models;


// GET
export const allOutwardList = asyncHandler(async (req, res) => {
    const { Outward, OutwardItem, Product } = req.dbModels;

    try {
        const { activeNode } = await getUserContext(req);

        let { page = 1, limit = 10, id = "", outward_no = "", isAdmin = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const outward = await Outward.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(outward_no && { outward_no }),
                ...(isAdmin ? {} : {
                    seller_business_node_id: activeNode.id,
                    ...(activeNode?.store && { store_id: activeNode.store.id })
                })
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
    const { Outward, OutwardItem, Product, Batch, BusinessNode, NodeDetail, Vendor, OutwardAllocation } = req.dbModels;
    try {
        const { outward_no = "" } = req.params;
        if (!outward_no) throw new Error("Outward No is required!!!");

        const outward = await Outward.findOne({
            where: { outward_no: outward_no.trim() },
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
            ]
        });
        if (!outward) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const jsonOutward = outward.toJSON();

        /** buyer details */
        if (jsonOutward.type === "internal") {
            jsonOutward.buyer = await BusinessNode.findOne({
                where: { id: jsonOutward.buyer_business_node_id },
                include: [
                    {
                        model: NodeDetail,
                        as: "nodeDetails"
                    }
                ]
            })
        } else if (jsonOutward.type === "external") {
            jsonOutward.buyer = await Vendor.findOne({
                where: { id: jsonOutward.buyer_business_node_id }
            })
            jsonOutward.buyer.meta = jsonOutward.meta;
            delete jsonOutward.meta;
        }

        if (jsonOutward.status !== "dispatched") {
            /** attach all batch details */
            for (const item of jsonOutward.outwardItemList) {
                const batch = await Batch.findAll({
                    where: {
                        product_id: item.vendor_product_id,
                        is_active: true,
                        batch_status: "active",
                        location_id: jsonOutward.seller_business_node_id,
                        ...(jsonOutward.store_id && { store_id: jsonOutward.store_id })
                    }
                });
                item.batch = batch || [];
                // batch.map(item => {
                //     console.log(item.toJSON());
                // })
            }
        } else {
            /** attach selected batch details */
            for (const item of jsonOutward.outwardItemList) {
                const outwardAllocation = await OutwardAllocation.findAll({
                    where: {
                        outward_item_id: item.id
                    },
                    include: [
                        {
                            model: Batch,
                            as: "batch",
                            attributes: ["id", "batch_no"]
                        }
                    ]
                });
                item.alloted_batch = outwardAllocation || [];
            }
        }

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: jsonOutward
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createOutward = asyncHandler(async (req, res) => {
    const { Outward, OutwardItem, Product, SalesOrder, SalesOrderItem, ManufacturingUnit } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { sales_order_id = "", store_id = "", priority = "", note = "", items = "" } = req.body;

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

            seller_business_node_id: store_id ? store.business_node_id : salesOrder.seller_business_node_id,
            ...(store_id && { store_id: store.id }),
            buyer_business_node_id: salesOrder.buyer_business_node_id,

            type: store_id ? "external" : "internal",
            priority,
            required_by: salesOrder.required_by,
            meta: store_id ? salesOrder.meta : null,
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

        salesOrder.status = "assign_fg";
        await salesOrder.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Created successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// PUT
export const confirmAllocation = asyncHandler(async (req, res) => {
    const { Outward, OutwardItem, Product, OutwardAllocation, Batch, SalesOrder, Vendor } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    // console.log(req.body.items); return
    // console.log(req.body); return

    try {
        const { outward_no = "", items = [] } = req.body;

        if (!outward_no || !Array.isArray(items) || items.length === 0) {
            await transaction.rollback()
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        const outward = await Outward.findOne({ where: { outward_no } });
        if (!outward) {
            await transaction.rollback()
            return res.status(404).json({ success: false, code: 404, message: "Outward not found!!!" });
        };

        /** update outward record */
        outward.dispatch_date = new Date();
        outward.status = "dispatched";
        await outward.save({ transaction });

        /** update outward items */
        // Array to store validated items and allocated batches for the GRN service
        let allocatedItems = [];
        for (const item of items) {
            const { product_id = "", batches = [] } = item;

            if (!product_id || !Array.isArray(batches) || batches.length === 0 || batches.some(b => !b)) {
                await transaction.rollback()
                return res.status(400).json({ success: false, code: 400, message: "Required fields are missing in items!!!" });
            };

            /** check product is valid or not */
            const product = await Product.findOne({ where: { id: Number(product_id) } });
            if (!product) {
                await transaction.rollback()
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            };

            /** check outward item is valid or not */
            const outwardItem = await OutwardItem.findOne({
                where: {
                    outward_id: outward.id,
                    vendor_product_id: Number(product_id)
                }
            });
            const requested_qty = outwardItem.requested_qty;

            /** batch allocation */
            let total_allocated = 0;
            // Temporary array to hold successful batch allocations for current item
            let itemAllocatedBatches = [];
            for (const batch_no of batches) {
                if (requested_qty === total_allocated) break;

                const batchRecord = await Batch.findOne({ where: { batch_no: batch_no } });
                if (!batchRecord) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, code: 404, message: "Batch not found!!!" });
                }

                const available = Number(batchRecord.available_qty);
                if (available <= 0) continue; // Skip batches with zero quantity

                const remaining_qty = Number(requested_qty) - total_allocated;

                if (remaining_qty >= available) {
                    // Consume the entire batch
                    batchRecord.available_qty = 0;
                    batchRecord.batch_status = "consumed";
                    batchRecord.is_active = false;
                    await batchRecord.save({ transaction });

                    total_allocated += available;
                }
                else {
                    // Consume only a part of the batch
                    batchRecord.available_qty = available - remaining_qty;
                    // Batch remains 'active' since it still has some quantity left
                    await batchRecord.save({ transaction });

                    total_allocated += remaining_qty;
                }

                /** create outward allocation record */
                const allocated_qty = remaining_qty >= available ? available : remaining_qty;

                if (allocated_qty <= 0) continue; // Sanity check to avoid zero-quantity allocations

                // Keep track of batches that were allocated to pass to createGrn_items
                itemAllocatedBatches.push({
                    batch_no: batchRecord.batch_no,
                    allocated_qty,
                    expiry_date: batchRecord.expiry_date
                });

                await OutwardAllocation.create({
                    outward_item_id: outwardItem.id,
                    product_id: product.id,
                    batch_id: batchRecord.id,
                    allocated_qty,
                    status: "dispatched"
                }, { transaction });
            }

            // If any batch was allocated successfully, push the product and its batches to our main array
            if (itemAllocatedBatches.length > 0) {
                allocatedItems.push({
                    vendor_product_id: product.id,
                    requested_qty: requested_qty,
                    allocated_batches: itemAllocatedBatches
                });
            }
        };

        const salesOrder = await SalesOrder.findOne({ where: { id: outward.sales_order_id } });
        await createGrn_items(salesOrder, allocatedItems);

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