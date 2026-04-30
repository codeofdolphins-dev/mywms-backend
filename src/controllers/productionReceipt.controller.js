import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNo, generateBatch } from "../helper/generate.js";

// GET
export const productionReceiptList = asyncHandler(async (req, res) => {
    const { ProductionReceipt, Product, ManufacturingUnit, User, ProductionOrder } = req.dbModels;

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
                    model: ProductionOrder,
                    as: "parentProductionOrder",
                    attributes: ["production_order_no"]
                },
                {
                    model: Product,
                    as: "receivedProduct",
                    // attributes: ["name", "barcode", "sku"]
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



// POST
export const createProductionReceipt = asyncHandler(async (req, res) => {
    const { ProductionReceipt, ProductionOrder, Product, ManufacturingUnit } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { production_order_id = "", fg_store_id = "", product_id = "", send_qty = "", mfg_date = "", receipt_no = "" } = req.body;
        if (!production_order_id || !fg_store_id || !product_id || !send_qty || !mfg_date) throw new Error("Required fields are missing!!!");

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
            send_qty: Number(send_qty),
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
        productionOrder.produced_qty = Number(send_qty) + Number(productionOrder.produced_qty || 0);
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


// PUT
export const acceptProductionReceipt = asyncHandler(async (req, res) => {
    const { ProductionReceipt, ProductionOrder, Product, Batch, NodeStockLedger, NodeStockLedgerItem } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { pr_no = "", receipt_id = "", batch_no = "", accepted_qty = "", damage_qty = "", shortage_qty = "" } = req.body;

        const userDetails = req.user;

        if (!pr_no || !receipt_id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Receipt No and Receipt ID are required!!!" });
        }

        if (!accepted_qty || Number(accepted_qty) <= 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Accepted qty must be greater than 0!!!" });
        }

        const productionReceipt = await ProductionReceipt.findOne({
            where: { id: Number(receipt_id), receipt_no: pr_no },
            include: [
                {
                    model: ProductionOrder,
                    as: "parentProductionOrder",
                },
                {
                    model: Product,
                    as: "receivedProduct",
                }
            ],
            transaction
        });

        if (!productionReceipt) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Production Receipt not found!!!" });
        }

        if (productionReceipt.status !== "pending") {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Cannot accept receipt in "${productionReceipt.status}" status!!!` });
        }

        const productionOrder = productionReceipt.parentProductionOrder;
        const product = productionReceipt.receivedProduct;

        const receivingLocationId = productionOrder.business_node_id;
        const receivingStoreId = productionReceipt.fg_store_id;
        const receivingLocationType = "mfg_unit";

        /** calculate expiry date from product shelf_life */
        let expiryDate = null;
        if (product.has_expiry && productionReceipt.mfg_date) {
            const mfgDate = new Date(productionReceipt.mfg_date);
            const shelfLife = Number(product.shelf_life) || 0;
            mfgDate.setDate(mfgDate.getDate() + shelfLife);
            expiryDate = mfgDate;
        }

        /** create NodeStockLedger header */
        const nodeStockLedger = await NodeStockLedger.create({
            transaction_type: "internal_transfer",
            txn_date: new Date(),

            from_location_id: productionOrder.mfg_location_id,
            from_location_type: "mfg_unit",

            to_location_id: receivingStoreId,
            to_location_type: receivingLocationType,

            reference_id: productionReceipt.id,
            reference_type: "others",
            created_by: userDetails?.id || 1,
        }, { transaction });

        const ledger_no = generateNo("LEDG", nodeStockLedger.id);
        await nodeStockLedger.update({ ledger_no }, { transaction });


        /** Create a new batch at the receiving location (FG Store) */
        const batchRecord = await Batch.create({
            product_id: product.id,
            location_id: receivingLocationId,
            store_id: receivingStoreId,
            location_type: receivingLocationType,
            batch_no: batch_no || null,
            available_qty: Number(accepted_qty),
            reserved_qty: 0,
            unit_price: 0,
            batch_status: "active",
            received_date: new Date(),
            mfg_date: productionReceipt.mfg_date,
            expiry_date: expiryDate,
            reference_id: productionReceipt.id,
            reference_type: "production",
        }, { transaction });

        /** auto-generate batch_no if not provided */
        if (!batch_no) {
            const generatedBatchNo = generateBatch("BAT", batchRecord.id);
            await batchRecord.update({ batch_no: generatedBatchNo }, { transaction });
        }

        /** create NodeStockLedgerItem record */
        await NodeStockLedgerItem.create({
            ledger_id: nodeStockLedger.id,
            product_id: product.id,
            batch_id: batchRecord.id,
            qty: Number(accepted_qty),
            unit_type: product.unit_type || "pcs",
            unit_price: 0,
            total_value: 0,
        }, { transaction });

        /** update production receipt with qty details and status */
        productionReceipt.received_qty = Number(accepted_qty);
        productionReceipt.dmg_qty = Number(damage_qty) || 0;
        productionReceipt.short_qty = Number(shortage_qty) || 0;
        productionReceipt.expiry_date = expiryDate;
        productionReceipt.status = "accepted";
        await productionReceipt.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Production Receipt accepted and batch created successfully." });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});