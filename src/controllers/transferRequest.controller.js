import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js"
import { getUserContext } from "../utils/getUserContext.js"
import { generateNo } from "../helper/generate.js"


// GET
export const transferOrderList = asyncHandler(async (req, res) => {
    const { TransferOrder, TransferOrderItem, TransferOrderAllocation, Product, ManufacturingUnit } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", text = "", type = "material_issue", status = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const user = await getUserContext(req);
        const store = user.activeNode?.store;

        const transferOrders = await TransferOrder.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(text ? { transfer_no: { [Op.iLike]: `%${text}%` } } : {}),
                ...(type && { type }),
                ...(status && { status }),
                ...(store && {
                    [Op.or]: [
                        { from_location_id: store.id },
                        { to_location_id: store.id }
                    ]
                })
            },
            include: [
                {
                    model: TransferOrderItem,
                    as: "transferOrderItem",
                    include: [
                        {
                            model: Product,
                            as: "transferProduct"
                        },
                        {
                            model: TransferOrderAllocation,
                            as: "transferItemAllocation"
                        },
                    ]
                }
            ],
            ...(noLimit ? {} : { limit, offset }),
            order: [["createdAt", "DESC"]]
        });

        if (!transferOrders) throw new Error("Fetched failed!!!");

        /** normalized */
        const formatedData = await Promise.all(transferOrders.rows?.map(async (item) => {
            const plain_JSON = item.toJSON();

            if (plain_JSON.from_location_type === "mfg_unit") {
                plain_JSON.from_location = await ManufacturingUnit.findByPk(plain_JSON.from_location_id, { attributes: ["name"] });
            }
            if (plain_JSON.to_location_type === "mfg_unit") {
                plain_JSON.to_location = await ManufacturingUnit.findByPk(plain_JSON.to_location_id, { attributes: ["name"] });
            }
            return plain_JSON;
        }));

        const totalItems = transferOrders.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formatedData,
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


export const transferOrderItemDetails = asyncHandler(async (req, res) => {
    const { TransferOrder, TransferOrderItem, TransferOrderAllocation, Product, ManufacturingUnit, Batch } = req.dbModels;

    try {
        const { to_no = 1 } = req.params;
        if (!to_no) throw new Error("to_no must required!!!");

        const transferOrders = await TransferOrder.findOne({
            where: { transfer_no: to_no },
            // attributes: {
            //     exclude: ["to_parent_node_id", "to_location_type", "created_by"]
            // },
            include: [
                {
                    model: TransferOrderItem,
                    as: "transferOrderItem",
                    include: [
                        {
                            model: Product,
                            as: "transferProduct"
                        },
                        // {
                        //     model: TransferOrderAllocation,
                        //     as: "transferItemAllocation"
                        // },
                    ]
                }
            ]
        });
        if (!transferOrders) {
            return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        }

        /** plain JSON */
        const jsonTO = transferOrders.toJSON();

        /** attach fulfiller details */
        if (jsonTO?.from_location_type === "mfg_unit") {
            jsonTO.sendTo = await ManufacturingUnit.findByPk(Number(jsonTO?.from_location_id))
        }

        if (jsonTO.status === "requested") {
            /** attach all available batch details */
            for (const item of jsonTO?.transferOrderItem) {

                // console.log(item.product_id, jsonTO?.to_parent_node_id, jsonTO.to_location_id, jsonTO?.to_location_type,)

                item.batch = await Batch.findAll({
                    where: {
                        product_id: item.product_id,
                        location_id: jsonTO?.to_parent_node_id,
                        store_id: jsonTO.to_location_id,
                        location_type: jsonTO?.to_location_type,
                        is_active: true
                    }
                })
            }
        } else {
            /** attach selected batch details */
            for (const item of jsonTO?.transferOrderItem) {
                item.alloted_batch = await TransferOrderAllocation.findAll({
                    where: { transferOrder_item_id: item.id },
                    include: [
                        {
                            model: Batch,
                            as: "allocatedBatch"
                        }
                    ]
                })
            }
        };

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: jsonTO,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createTransferRequest = asyncHandler(async (req, res) => {
    const { TransferOrder, TransferOrderItem, ManufacturingUnit, Product } = req.dbModels;

    // console.log(req.role); return

    try {
        const { type = "", required_date = "", rm_store_id = "", items = {} } = req.body;

        if ([type, required_date, rm_store_id, items].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const user = await getUserContext(req);
        const store = user.activeNode?.store;

        if (store?.store_type !== "production") throw new Error("Only production users can create this!!!");

        const rmStore = await ManufacturingUnit.findByPk(
            Number(rm_store_id),
            {
                where: {
                    store_type: "rm_store"
                }
            }
        );
        if (!rmStore) throw new Error("RM store record not found!!!")


        // console.log(user); return

        // Create Transfer Order
        const transferOrder = await TransferOrder.create({
            type,
            from_parent_node_id: store.business_node_id,
            from_location_id: store.id,

            to_parent_node_id: rmStore.business_node_id,
            to_location_id: rmStore.id,

            required_date: new Date(required_date),
            status: "requested",
            created_by: user.id
        });
        if (!transferOrder) {
            return res.status(500).json({ success: false, code: 500, message: "Record creation failed!!!" });
        };

        transferOrder.transfer_no = generateNo("TO-WI-RM", transferOrder.id);
        await transferOrder.save();

        // Create Transfer Order Items
        for (const item of items) {
            const { raw_product_id = "", required_qty = "" } = item;

            const product = await Product.findByPk(Number(raw_product_id));
            if (!product) {
                return res.status(404).json({ success: false, code: 404, message: "product record not found!!!" });
            };

            await TransferOrderItem.create({
                transfer_order_id: transferOrder.id,
                product_id: product.id,
                requested_qty: required_qty
            });
        }

        res.status(201).json({ success: true, code: 201, message: "Transfer request created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// PUT
export const confirmAllocation = asyncHandler(async (req, res) => {
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