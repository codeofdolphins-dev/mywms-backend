import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js"
import { getUserContext } from "../utils/getUserContext.js"
import { generateNo, generateBatch } from "../helper/generate.js"


// GET
export const productionOrderList = asyncHandler(async (req, res) => {
    const { ProductionOrder, ProductionOrderItem, Product, User } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", status = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const user = await getUserContext(req);
        const store = user.activeNode?.store;

        const productionOrders = await ProductionOrder.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(status && { status }),
                business_node_id: user.activeNode.id,
                mfg_location_id: store.id
            },
            include: [
                {
                    model: ProductionOrderItem,
                    as: "productionOrderItem",
                    // include: [
                    //     {
                    //         model: Product,
                    //         as: "rmProduct"
                    //     }
                    // ]
                },
                {
                    model: Product,
                    as: "targetProduct",
                    attributes: ["name"]
                },
                {
                    model: User,
                    as: "proCreator",
                    attributes: ["name"]
                }
            ],
            ...(noLimit ? {} : { limit, offset }),
            order: [["createdAt", "DESC"]]
        });

        if (!productionOrders) throw new Error("Fetched failed!!!");

        const totalItems = productionOrders.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: productionOrders.rows,
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

export const productionOrderItemDetails = asyncHandler(async (req, res) => {
    const { ProductionOrder, ProductionOrderItem, Product, User } = req.dbModels;

    try {
        const { pro_no } = req.params;
        if (!pro_no) throw new Error("Production Order No. is required!!!");


        const productionOrders = await ProductionOrder.findOne({
            where: { production_order_no: pro_no },
            include: [
                {
                    model: ProductionOrderItem,
                    as: "productionOrderItem",
                    include: [
                        {
                            model: Product,
                            as: "rmProduct"
                        }
                    ]
                },
                {
                    model: Product,
                    as: "targetProduct",
                    // attributes: ["name"]
                },
                {
                    model: User,
                    as: "proCreator",
                    // attributes: ["name"]
                }
            ]
        });
        if (!productionOrders) throw new Error("Fetched failed!!!");

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: productionOrders
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createProductionOrder = asyncHandler(async (req, res) => {
    const { ProductionOrder, ProductionOrderItem, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { finished_product_id = "", planned_qty = "", items = {} } = req.body;

        if ([finished_product_id, planned_qty, items].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const user = await getUserContext(req);
        const store = user.activeNode?.store;

        if (store?.store_type !== "production") throw new Error("Only production users can create this!!!");

        const product = await Product.findByPk(Number(finished_product_id));
        if (!product) throw new Error("Record not found!!!");

        // Create Transfer Order
        const productionOrder = await ProductionOrder.create({
            business_node_id: user.activeNode.id,
            mfg_location_id: store.id,
            target_product_id: product.id,
            planned_qty,
            status: "in_progress",
            start_date: new Date(),
            created_by: user.id
        }, { transaction });

        if (!productionOrder) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Record creation failed!!!" });
        };

        /** generate production order no */
        productionOrder.production_order_no = generateNo("MFG-PO", productionOrder.id);
        await productionOrder.save({ transaction });

        /** create production order items */
        for (const item of items) {
            const { raw_product_id = "", required_qty = "" } = item;

            if ([raw_product_id, required_qty].some(i => i === "")) throw new Error("Required fields are missing in items!!!");

            const product = await Product.findByPk(Number(raw_product_id));
            if (!product) {
                return res.status(404).json({ success: false, code: 404, message: "product record not found in items!!!" });
            };

            await ProductionOrderItem.create({
                production_order_id: productionOrder.id,
                rm_product_id: product.id,
                required_qty: Number(required_qty)
            }, { transaction });
        }

        await transaction.commit();
        res.status(201).json({ success: true, code: 201, message: "Production order created successfully" });

    } catch (error) {
        console.error(error);
        await transaction.rollback();
        res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// PUT
const confirmAllocation = asyncHandler(async (req, res) => {
    const { TransferOrder, TransferOrderItem, Product, TransferOrderAllocation, Batch } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { transfer_order_no = "", items = [] } = req.body;

        if (!transfer_order_no || !Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        const transferOrder = await TransferOrder.findOne({ where: { transfer_no: transfer_order_no } });
        if (!transferOrder) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Transfer order not found!!!" });
        }

        /** update transfer order record */
        transferOrder.status = "dispatched";
        await transferOrder.save({ transaction });

        /** process items and allocate batches */
        for (const item of items) {
            const { product_id = "", item_id = "", batches = [] } = item;

            if (!product_id || !item_id || !Array.isArray(batches) || batches.length === 0 || batches.some(b => !b)) {
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 400, message: "Required fields are missing in items!!!" });
            }

            /** check product is valid or not */
            const product = await Product.findOne({ where: { id: Number(product_id) } });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            }

            /** check transfer order item is valid or not */
            const transferOrderItem = await TransferOrderItem.findByPk(Number(item_id));
            if (!transferOrderItem) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Transfer order item not found!!!" });
            }

            const requested_qty = Number(transferOrderItem.requested_qty);

            /** batch allocation */
            let total_allocated = 0;
            for (const batch_no of batches) {
                if (requested_qty === total_allocated) break;

                const batchRecord = await Batch.findOne({ where: { batch_no: batch_no } });
                if (!batchRecord) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, code: 404, message: `Batch ${batch_no} not found!!!` });
                }

                const available = Number(batchRecord.available_qty);
                if (available <= 0) continue; // Skip batches with zero quantity

                const remaining_qty = requested_qty - total_allocated;

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

                /** create transfer order allocation record */
                const allocated_qty = remaining_qty >= available ? available : remaining_qty;

                if (allocated_qty <= 0) continue; // Sanity check to avoid zero-quantity allocations

                await TransferOrderAllocation.create({
                    transferOrder_item_id: transferOrderItem.id,
                    batch_id: batchRecord.id,
                    allocated_qty
                }, { transaction });
            }

            transferOrderItem.dispatched_qty = total_allocated;
            await transferOrderItem.save({ transaction });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Allocation confirmed successfully." });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


const confirmTransferOrderReceived = asyncHandler(async (req, res) => {
    const { TransferOrder, TransferOrderItem, Product, TransferOrderAllocation, Batch, NodeStockLedger, NodeStockLedgerItem } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { to_no = "", items = [] } = req.body;
        const userDetails = req.user;

        if (!to_no || !Array.isArray(items) || items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        /** find and validate transfer order */
        const transferOrder = await TransferOrder.findOne({ where: { transfer_no: to_no }, transaction });
        if (!transferOrder) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Transfer order not found!!!" });
        }
        if (transferOrder.status !== "dispatched") {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Cannot receive a transfer order in "${transferOrder.status}" status!!!` });
        }

        /**
         * Receiving location = the requester (from_*) since
         * from = production unit that requested the material
         * to   = RM store that fulfilled/dispatched the material
         */
        const receivingLocationId = transferOrder.from_parent_node_id;
        const receivingStoreId = transferOrder.from_location_id;
        const receivingLocationType = transferOrder.from_location_type;

        /** create NodeStockLedger header (one per receive) */
        const nodeStockLedger = await NodeStockLedger.create({
            transaction_type: "internal_transfer",
            txn_date: new Date(),

            from_location_id: transferOrder.to_location_id,
            from_location_type: transferOrder.to_location_type,

            to_location_id: transferOrder.from_location_id,
            to_location_type: transferOrder.from_location_type,

            reference_id: transferOrder.id,
            reference_type: "transfer_order",
            created_by: userDetails.id,
        }, { transaction });

        const ledger_no = generateNo("LEDG", nodeStockLedger.id);
        await nodeStockLedger.update({ ledger_no }, { transaction });

        /** process each item */
        for (const item of items) {
            const { item_id, product_id, allocations = [] } = item;

            if (!item_id || !product_id || !Array.isArray(allocations) || allocations.length === 0) {
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 400, message: "Required fields are missing in items!!!" });
            }

            /** validate product */
            const product = await Product.findByPk(Number(product_id), { transaction });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: `Product id: ${product_id} not found!!!` });
            }

            /** validate transfer order item */
            const transferOrderItem = await TransferOrderItem.findByPk(Number(item_id), { transaction });
            if (!transferOrderItem) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Transfer order item not found!!!" });
            }

            let totalReceivedQty = 0;

            /** process each allocation (batch-level) */
            for (const alloc of allocations) {
                const { item_alloc_id, batch_no, r_qty, d_qty, s_qty, e_date } = alloc;

                const receivedQty = Number(r_qty || 0);
                const damageQty = Number(d_qty || 0);
                const shortageQty = Number(s_qty || 0);

                /** update the existing TransferOrderAllocation record with damage/shortage info */
                if (item_alloc_id) {
                    const allocation = await TransferOrderAllocation.findByPk(Number(item_alloc_id), { transaction });
                    if (!allocation) {
                        await transaction.rollback();
                        return res.status(404).json({ success: false, code: 404, message: `Allocation id: ${item_alloc_id} not found!!!` });
                    }

                    await allocation.update({
                        demaged_qty: damageQty,
                        shortage_qty: shortageQty,
                    }, { transaction });
                }

                /**
                 * Create or update batch at the RECEIVING location (production unit).
                 * The Batch table is shared across all locations, so we must scope
                 * by product_id + location_id + store_id + location_type to avoid
                 * mixing inventory across different locations.
                 */
                let batchRecord = null;

                if (receivedQty > 0) {
                    let existingBatch = null;

                    if (batch_no) {
                        existingBatch = await Batch.findOne({
                            where: {
                                batch_no,
                                product_id: product.id,
                                location_id: receivingLocationId,
                                store_id: receivingStoreId,
                                location_type: receivingLocationType,
                            },
                            transaction
                        });
                    }

                    if (existingBatch) {
                        /** batch already exists at receiving location — increment qty */
                        await existingBatch.update({
                            available_qty: Number(existingBatch.available_qty) + receivedQty,
                        }, { transaction });
                        batchRecord = existingBatch;
                    } else {
                        /** create a new batch at the receiving location */
                        batchRecord = await Batch.create({
                            product_id: product.id,
                            location_id: receivingLocationId,
                            store_id: receivingStoreId,
                            location_type: receivingLocationType,
                            batch_no: batch_no || null,
                            available_qty: receivedQty,
                            reserved_qty: 0,
                            unit_price: 0,
                            batch_status: "active",
                            received_date: new Date(),
                            expiry_date: e_date ? new Date(e_date) : null,
                            reference_id: transferOrder.id,
                            reference_type: "others",
                        }, { transaction });

                        /** auto-generate batch_no if not provided */
                        if (!batch_no) {
                            const generatedBatchNo = generateBatch("BAT", batchRecord.id);
                            await batchRecord.update({ batch_no: generatedBatchNo }, { transaction });
                        }
                    }

                    /** create NodeStockLedgerItem record */
                    const unitPrice = Number(batchRecord.unit_price || 0);
                    await NodeStockLedgerItem.create({
                        ledger_id: nodeStockLedger.id,
                        product_id: product.id,
                        batch_id: batchRecord.id,
                        qty: receivedQty,
                        unit_type: product.unit_type || "pcs",
                        unit_price: unitPrice,
                        total_value: receivedQty * unitPrice,
                    }, { transaction });
                }

                totalReceivedQty += receivedQty;
            }

            /** update the transfer order item with total received qty */
            transferOrderItem.received_qty = totalReceivedQty;
            await transferOrderItem.save({ transaction });
        }

        /** mark transfer order as received */
        transferOrder.status = "received";
        await transferOrder.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Transfer order received successfully." });

    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});