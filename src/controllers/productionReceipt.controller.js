import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNo } from "../helper/generate.js";

// GET
export const productionReceiptList = asyncHandler(async (req, res) => {
    const { ProductionReceipt, Product, ManufacturingUnit, User } = req.dbModels;

    try {
        let { page = 1, limit = 10, proNo = "" } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let proOrder = null
        if (proNo?.trim()) {
            proOrder = await ProductionOrder.findOne({ where: { production_order_no: proNo?.trim() } })
            if (!proOrder) throw new Error("Production Order record not found!!!")
        }


        const productionReceipt = await ProductionReceipt.findAndCountAll({
            where: {
                ...(proNo && { production_order_id: proOrder.id })
            },
            distinct: true,
            include: [
                {
                    model: Product,
                    as: "receivedProduct",
                    attributes: ["name", "barcode", "sku"]
                },
                {
                    model: ManufacturingUnit,
                    as: "fgStore",
                    attributes: ["name"]
                },
                {
                    model: User,
                    as: "proReceiptCreator",
                    attributes: ["name"]
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!productionReceipt) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = productionReceipt.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: productionReceipt.rows,
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



const purchasOrderItemDetails = asyncHandler(async (req, res) => {
    const { PurchasOrder, PurchaseOrderItem, User, BusinessNode, NodeDetails, RequisitionItem, Product, Vendor } = req.dbModels;

    try {
        let { page = 1, limit = 10, poNo = "", noLimit = false } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const purchasOrder = await PurchasOrder.findOne({
            where: {
                po_no: {
                    [Op.iLike]: poNo?.trim()
                }
            },
            include: [
                {
                    model: User,
                    as: "POcreatedBy",
                    attributes: ["email", "name", "phone_no", "profile_image", "company_name", "address"]
                },
            ],
        });
        if (!purchasOrder) throw new Error("Record not found!!!");

        const poJson = purchasOrder.toJSON();
        if (poJson.type === 'internal') {
            poJson.poVendor = await BusinessNode.findOne({
                where: { id: poJson.to_supplier_id },
                include: [
                    {
                        model: NodeDetails,
                        as: "nodeDetails"
                    }
                ]
            });
        } else if (poJson.type === 'bpo_release') {
            poJson.poVendor = await Vendor.findOne({
                where: { id: poJson.to_supplier_id }
            });
        }

        const { rows, count } = await PurchaseOrderItem.findAndCountAll({
            where: {
                purchase_order_id: purchasOrder.id
            },
            ...(!noLimit && { limit, offset }),
            order: [["createdAt", "ASC"]],
            include: [
                {
                    model: Product,
                    as: "poi_product",
                }
            ]
        });

        const totalItems = count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: {
                ...poJson,
                items: rows
            },
            ...(!noLimit && {
                pagination: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            })
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



// POST
export const createProductionReceipt = asyncHandler(async (req, res) => {
    const { ProductionReceipt, ProductionOrder, Product, ManufacturingUnit } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { production_order_id = "", fg_store_id = "", product_id = "", received_qty = "", mfg_date = "", receipt_no = "" } = req.body;
        if (!production_order_id || !fg_store_id || !product_id || !received_qty || !mfg_date) throw new Error("Required fields are missing!!!");

        const user = req.user;

        /** check Production Order exists */
        const productionOrder = await ProductionOrder.findByPk(Number(production_order_id));
        if (!productionOrder) throw new Error("Production Order record not found!!!");


        /** check FG Store */
        const fgStore = await ManufacturingUnit.findOne({
            where: {
                id: fg_store_id,
                store_type: "fg_store"
            }
        });
        if (!fgStore) throw new Error("FG Store not found!!!");


        /** Check Product */
        const product = await Product.findByPk(Number(product_id));
        if (!product) throw new Error("Product not found!!!");


        const productionReceipt = await ProductionReceipt.create({
            ...(receipt_no && { receipt_no: `PR-${receipt_no.trim()}` }),
            production_order_id: Number(production_order_id),
            fg_store_id: Number(fg_store_id),
            product_id: Number(product_id),
            received_qty: Number(received_qty),
            mfg_date: new Date(mfg_date),
            created_by: Number(user.id),
        }, { transaction });

        // generate receipe number
        if (!receipt_no) {
            productionReceipt.receipt_no = generateNo("PR", productionReceipt.id)
            await productionReceipt.save({ transaction });
        }

        /** 
         * update produced qty in production order
         * If produced_qty is greater then planned_qty then set the status to completed
         */
        productionOrder.produced_qty = Number(received_qty) + Number(productionOrder.produced_qty || 0);
        if (productionOrder.produced_qty >= productionOrder.planned_qty) {
            productionOrder.status = "completed";
            productionOrder.completion_date = new Date();
        }
        await productionOrder.save({ transaction });



        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Production Receipt Created" });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// DELETE
const deletePurchasOrder = asyncHandler(async (req, res) => {
    const { PurchasOrder } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await PurchasOrder.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updatePurchasOrder = asyncHandler(async (req, res) => {
    const { PurchasOrder } = req.dbModels;
    try {
        const { id = "", status = "", priority = "", expected_delivery_date = "", note = "" } = req.body;
        const userDetails = req.user;

        const purchasOrder = await PurchasOrder.findByPk(id);
        if (!purchasOrder) return res.status(404).json({ success: false, code: 404, message: "Purchase Order not found!!!" });

        // const currentStatus = requisition.status;
        // if (["draft", "submitted"].some(item => item === currentStatus))

        let updateDetails = {};
        if (status) updateDetails.status = status.toLowerCase();
        if (priority) updateDetails.priority = priority.toLowerCase();
        if (expected_delivery_date) updateDetails.expected_delivery_date = expected_delivery_date;
        if (note) updateDetails.note = note;
        updateDetails.approved_by = userDetails.id

        const isUpdate = await PurchasOrder.update(
            updateDetails,
            { where: { id } }
        );
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updatePurchasOrderItem = asyncHandler(async (req, res) => {
    const { PurchasOrder, PurchaseOrderItem } = req.dbModels;
    try {
        const { id = "", quantity_ordered = "", unit_price = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const PurchaseOrderItem = await PurchaseOrderItem.findByPk(id);
        if (!PurchaseOrderItem) return res.status(404).json({ success: false, code: 404, message: "Item Not found!!!" });

        const purchasOrder = await PurchasOrder.findByPk(PurchaseOrderItem.po_id);

        let updateDetails = {};
        if (note) updateDetails.note = note;

        if (quantity_ordered && unit_price) {
            updateDetails.line_total = quantity_ordered * unit_price;
            updateDetails.quantity_ordered = quantity_ordered;
            updateDetails.unit_price = unit_price;

        } else if (unit_price) {
            updateDetails.line_total = PurchaseOrderItem.quantity_ordered * unit_price;
            updateDetails.unit_price = unit_price;

        } else if (quantity_ordered) {
            updateDetails.line_total = quantity_ordered * PurchaseOrderItem.unit_price;
            updateDetails.quantity_ordered = quantity_ordered;
        }

        await PurchaseOrderItem.update(
            updateDetails,
            { where: { id } }
        );

        const total_amount = purchasOrder.total_amount - PurchaseOrderItem.line_total + updateDetails.line_total
        const isUpdate = await PurchasOrder.update(
            { total_amount },
            { where: { id: purchasOrder.id } }
        );
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});