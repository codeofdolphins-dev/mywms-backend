import { Op } from "sequelize";
import { generateNo } from "../helper/generate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserContext } from "../utils/getUserContext.js";
import { createGrn_items_internal } from "../services/createGrn.service.js";


// GET
export const list = asyncHandler(async (req, res) => {
    const { DirectTransfer, DirectTransferItem, DirectTransferAllocation, Product, Batch, BusinessNode, ManufacturingUnit, User, NodeDetails } = req.dbModels;

    try {
        let { id = "", page = 1, limit = 10, trans_no = "", status = "" } = req.query;

        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const currentLocation = req.activeNode;


        const directTransfers = await DirectTransfer.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(trans_no && { dir_trans_no: { [Op.iLike]: `${trans_no?.trim()}%` } }),
                from_location_id: currentLocation,
                ...(status && { status: status?.toLowercase() })
            },
            include: [
                {
                    model: BusinessNode,
                    as: "fromLocation",
                    attributes: ["id", "name", "node_type_code"],
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails"
                        }
                    ]
                },
                {
                    model: BusinessNode,
                    as: "toLocation",
                    attributes: ["id", "name", "node_type_code"],
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails"
                        }
                    ]
                },
                {
                    model: ManufacturingUnit,
                    as: "fromManufacturingUnit",
                    attributes: ["id", "name", "store_type"]
                },
                {
                    model: User,
                    as: "transferCreator",
                    attributes: ["id", "name", "email"]
                },
                {
                    model: DirectTransferItem,
                    as: "transferItems",
                    include: [
                        {
                            model: Product,
                            as: "transferItemProduct"
                        },
                        {
                            model: DirectTransferAllocation,
                            as: "allocations",
                            include: [
                                {
                                    model: Batch,
                                    as: "allocationBatch"
                                }
                            ]
                        }
                    ]
                }
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            distinct: true
        });

        if (!directTransfers) throw new Error("Fetch failed!!!");

        const totalItems = directTransfers.count;
        const totalPages = Math.ceil(totalItems / limit);

        const paginationInfo = {
            totalItems,
            totalPages,
            currentPage: page,
            limit
        };

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: directTransfers.rows,
            pagination: paginationInfo
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

/** get list of next sequence nodes */
export const getCreateDirectTransferContext = asyncHandler(async (req, res) => {
    const { BusinessNode, TenantBusinessFlow, NodeDetails } = req.dbModels;

    try {
        const activeNode = req.activeNode;
        if (!activeNode) throw new Error("Active node not found!!!");

        /** get total count of business flow */
        const count = await TenantBusinessFlow.count();

        /** Get Current Node with their parent flow */
        const node = await BusinessNode.findByPk(Number(activeNode), {
            include: [
                {
                    model: TenantBusinessFlow,
                    as: "parentFlow",
                    attributes: ["sequence"]
                }
            ]
        });

        const currentSeq = node?.parentFlow?.sequence;
        if (currentSeq === count) {
            return res.status(400).json({
                success: false,
                code: 400,
                message: "This is the last sequence, cannot create direct transfer!!!"
            });
        }

        const nextNodes = await BusinessNode.findAll({
            distinct: true,
            include: [
                {
                    model: TenantBusinessFlow,
                    as: "parentFlow",
                    where: {
                        sequence: currentSeq + 1
                    },
                    order: [["sequence", "DESC"]]
                },
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                }
            ]
        });

        const formatRes = nextNodes.map(item => {
            item = item.toJSON();
            delete item.parentFlow;
            return item.nodeDetails;
        });

        return res.status(200).json({ success: true, code: 200, data: formatRes, message: "Data fetched successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createRecord = asyncHandler(async (req, res) => {
    const { BusinessNode, DirectTransfer, DirectTransferItem, DirectTransferAllocation, Product, Batch } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { target_location_id = "", items = [] } = req.body;
        if (!target_location_id || items?.length === 0) throw new Error("All fields are required!!!");

        const userDetails = await getUserContext(req);
        const currentLocation = req.activeNode;
        const storeId = userDetails?.activeNode?.store?.id;

        const businessNode = await BusinessNode.findByPk(Number(target_location_id));
        if (!businessNode) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Target location not found!!!" });
        }

        /** Create main transfer record */
        const directTransfer = await DirectTransfer.create({
            from_location_id: currentLocation,
            ...(storeId && { from_mfg_unit_id: storeId }),
            target_location_id: Number(target_location_id),
            transfer_date: new Date(),
            created_by: userDetails.id
        }, { transaction });

        const transNo = generateNo("DIR", directTransfer.id);
        directTransfer.dir_trans_no = transNo;
        await directTransfer.save({ transaction });

        let allocatedItems = [];
        /** Process all items */
        for (const item of items) {
            const { product_id, barcode, allocations } = item;
            if (!product_id || !barcode || allocations?.length === 0) throw new Error("Item fields are required!!!");

            const product = await Product.findOne({
                where: {
                    id: Number(product_id),
                    barcode
                }
            });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            };

            const directTransferItem = await DirectTransferItem.create({
                dir_transfer_id: directTransfer.id,
                product_id
            }, { transaction });

            let total_send_qty = 0;
            let itemAllocatedBatches = [];

            for (const alloc of allocations) {
                const { batch_id, send_qty } = alloc;

                if (!batch_id || !send_qty || send_qty <= 0) throw new Error("Invalid allocation details provided!!!")

                const batch = await Batch.findOne({
                    where: {
                        id: Number(batch_id),
                        is_active: true
                    }
                });
                if (!batch) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, code: 404, message: "Batch not found!!!" });
                };

                if (batch.product_id !== Number(product_id)) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, code: 400, message: `Batch ${batch.batch_no || batch.id} does not belong to the selected product!!!` });
                }

                if (Number(batch.available_qty) < Number(send_qty)) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, code: 400, message: `Insufficient quantity in batch ${batch.batch_no || batch.id}. Available: ${batch.available_qty}, Requested: ${send_qty}!!!` });
                }

                /** Create DirectTransferAllocation record */
                await DirectTransferAllocation.create({
                    dir_transfer_item_id: directTransferItem.id,
                    batch_id: Number(batch_id),
                    send_qty: Number(send_qty)
                }, { transaction });

                batch.available_qty = Number(batch.available_qty) - Number(send_qty);
                await batch.save({ transaction });

                itemAllocatedBatches.push({
                    batch_no: batch.batch_no,
                    allocated_qty: Number(send_qty),
                    expiry_date: batch.expiry_date
                });

                total_send_qty += Number(send_qty);
            }

            if (itemAllocatedBatches.length > 0) {
                allocatedItems.push({
                    vendor_product_id: product.id,
                    requested_qty: total_send_qty,
                    allocated_batches: itemAllocatedBatches
                });
            };

            directTransferItem.total_send_qty = total_send_qty;
            await directTransferItem.save({ transaction });
        }

        await createGrn_items_internal(
            req,
            transaction,
            {
                store_id: storeId || null,
                seller_business_node_id: currentLocation,
                buyer_business_node_id: Number(target_location_id)
            },
            allocatedItems,
            transNo
        );

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Created Successfully.", data: directTransfer });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message })
    }
});


// PUT
export const updateRecord = asyncHandler(async (req, res) => {
    const { DirectTransfer, DirectTransferItem, DirectTransferAllocation, Product, Batch, GRN, GRNItem, GRNItemBatch } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id, target_location_id = "", items = [] } = req.body;
        if (!id || !target_location_id || items?.length === 0) throw new Error("All fields are required!!!");

        const userDetails = await getUserContext(req);
        const currentLocation = req.activeNode;
        const storeId = userDetails?.activeNode?.store?.id;

        const directTransfer = await DirectTransfer.findOne({
            where: { id: Number(id), from_location_id: currentLocation },
            include: [
                {
                    model: DirectTransferItem,
                    as: "transferItems",
                    include: [
                        {
                            model: DirectTransferAllocation,
                            as: "allocations"
                        }
                    ]
                }
            ]
        });

        if (!directTransfer) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Direct transfer not found!!!" });
        }

        if (directTransfer.status !== "send" && directTransfer.status !== "draft") {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Only direct transfers in draft or send status can be updated!!!" });
        }

        // Revert all previous batch allocations
        for (const item of directTransfer.transferItems) {
            for (const alloc of item.allocations) {
                const batch = await Batch.findByPk(alloc.batch_id);
                if (batch) {
                    batch.available_qty = Number(batch.available_qty) + Number(alloc.send_qty);
                    await batch.save({ transaction });
                }
            }
        }

        // Delete old items and allocations
        for (const item of directTransfer.transferItems) {
            await DirectTransferAllocation.destroy({ where: { dir_transfer_item_id: item.id }, transaction });
            await item.destroy({ transaction });
        }

        // Update main record
        directTransfer.target_location_id = Number(target_location_id);
        await directTransfer.save({ transaction });

        let allocatedItems = [];
        // Process new items
        for (const item of items) {
            const { product_id, barcode, allocations } = item;
            if (!product_id || !barcode || allocations?.length === 0) throw new Error("Item fields are required!!!");

            const product = await Product.findOne({
                where: {
                    id: Number(product_id),
                    barcode
                }
            });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            }

            const directTransferItem = await DirectTransferItem.create({
                dir_transfer_id: directTransfer.id,
                product_id
            }, { transaction });

            let total_send_qty = 0;
            let itemAllocatedBatches = [];

            for (const alloc of allocations) {
                const { batch_id, send_qty } = alloc;

                if (!batch_id || !send_qty || send_qty <= 0) throw new Error("Invalid allocation details provided!!!");

                const batch = await Batch.findOne({
                    where: {
                        id: Number(batch_id),
                        is_active: true
                    }
                });
                if (!batch) {
                    await transaction.rollback();
                    return res.status(404).json({ success: false, code: 404, message: "Batch not found!!!" });
                }

                if (batch.product_id !== Number(product_id)) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, code: 400, message: `Batch ${batch.batch_no || batch.id} does not belong to the selected product!!!` });
                }

                if (Number(batch.available_qty) < Number(send_qty)) {
                    await transaction.rollback();
                    return res.status(400).json({ success: false, code: 400, message: `Insufficient quantity in batch ${batch.batch_no || batch.id}. Available: ${batch.available_qty}, Requested: ${send_qty}!!!` });
                }

                await DirectTransferAllocation.create({
                    dir_transfer_item_id: directTransferItem.id,
                    batch_id: Number(batch_id),
                    send_qty: Number(send_qty)
                }, { transaction });

                batch.available_qty = Number(batch.available_qty) - Number(send_qty);
                await batch.save({ transaction });

                itemAllocatedBatches.push({
                    batch_no: batch.batch_no,
                    allocated_qty: Number(send_qty),
                    expiry_date: batch.expiry_date
                });

                total_send_qty += Number(send_qty);
            }

            if (itemAllocatedBatches.length > 0) {
                allocatedItems.push({
                    vendor_product_id: product.id,
                    requested_qty: total_send_qty,
                    allocated_batches: itemAllocatedBatches
                });
            }

            directTransferItem.total_send_qty = total_send_qty;
            await directTransferItem.save({ transaction });
        }

        // Find and delete the corresponding draft GRN if it exists
        const grn = await GRN.findOne({
            where: {
                sender_id: currentLocation,
                receiver_id: directTransfer.target_location_id,
                status: "draft",
                grn_type: "transfer"
            },
            order: [["createdAt", "DESC"]]
        });
        if (grn) {
            const grnItems = await GRNItem.findAll({ where: { grn_id: grn.id } });
            for (const grnItem of grnItems) {
                await GRNItemBatch.destroy({ where: { grn_item_id: grnItem.id }, transaction });
                await grnItem.destroy({ transaction });
            }
            await grn.destroy({ transaction });
        }

        // Create new draft GRN
        await createGrn_items_internal(
            req,
            transaction,
            {
                store_id: storeId || null,
                seller_business_node_id: currentLocation,
                buyer_business_node_id: Number(target_location_id)
            },
            allocatedItems
        );

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully.", data: directTransfer });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message });
    }
});


// DELETE
export const deleteRecord = asyncHandler(async (req, res) => {
    const { DirectTransfer, DirectTransferItem, DirectTransferAllocation, Batch, GRN, GRNItem, GRNItemBatch } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "ID is required!!!" });

        const currentLocation = req.activeNode;

        const directTransfer = await DirectTransfer.findOne({
            where: { id: Number(id), from_location_id: currentLocation },
            include: [
                {
                    model: DirectTransferItem,
                    as: "transferItems",
                    include: [
                        {
                            model: DirectTransferAllocation,
                            as: "allocations"
                        }
                    ]
                }
            ]
        });

        if (!directTransfer) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Direct transfer not found!!!" });
        }

        if (directTransfer.status !== "send" && directTransfer.status !== "draft") {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Only direct transfers in draft or send status can be deleted!!!" });
        }

        // Revert all batch allocations
        for (const item of directTransfer.transferItems) {
            for (const alloc of item.allocations) {
                const batch = await Batch.findByPk(alloc.batch_id);
                if (batch) {
                    batch.available_qty = Number(batch.available_qty) + Number(alloc.send_qty);
                    await batch.save({ transaction });
                }
            }
        }

        // Delete associated draft GRN
        const grn = await GRN.findOne({
            where: {
                sender_id: currentLocation,
                receiver_id: directTransfer.target_location_id,
                status: "draft",
                grn_type: "transfer"
            },
            order: [["createdAt", "DESC"]]
        });
        if (grn) {
            const grnItems = await GRNItem.findAll({ where: { grn_id: grn.id } });
            for (const grnItem of grnItems) {
                await GRNItemBatch.destroy({ where: { grn_item_id: grnItem.id }, transaction });
                await grnItem.destroy({ transaction });
            }
            await grn.destroy({ transaction });
        }

        // Delete items and allocations
        for (const item of directTransfer.transferItems) {
            await DirectTransferAllocation.destroy({ where: { dir_transfer_item_id: item.id }, transaction });
            await item.destroy({ transaction });
        }

        await directTransfer.destroy({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message });
    }
});