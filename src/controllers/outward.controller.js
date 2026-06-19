import { Op } from "sequelize";
import { generateNo } from "../helper/generate.js";
import { createGrn_items_external, createGrn_items_internal } from "../services/createGrn.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserContext } from "../utils/getUserContext.js";
import { createInvoice } from "../services/createInvoice.service.js";


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
                ...(outward_no && { outward_no: { [Op.iLike]: `%${outward_no.trim()}%` } }),
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
            order: [["createdAt", "DESC"]]
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
    const { Outward, OutwardItem, Product, Batch, BusinessNode, NodeDetails, Vendor, OutwardAllocation, User } = req.dbModels;
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
            const user = await BusinessNode.findOne({
                where: { id: jsonOutward.buyer_business_node_id },
                include: [
                    {
                        model: NodeDetails,
                        as: "nodeDetails"
                    },
                    {
                        model: User,
                        as: "businessNodeUser",
                        through: {
                            where: {
                                isNodeAdmin: true
                            },
                            attributes: []
                        },
                        attributes: ["email", "phone_no"]
                    }
                ]
            })

            const userData = user?.toJSON();
            if (userData) {
                const [nodeAdmin = {}] = userData.businessNodeUser;
                userData.email = nodeAdmin?.email || null;
                userData.phone_no = nodeAdmin?.phone_no || null;
                delete userData.businessNodeUser;
            }
            jsonOutward.buyer = userData;

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
    const { Outward, OutwardItem, Product, SalesOrder, ManufacturingUnit, Requisition, RequisitionSupplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    // console.log(req.body); return;

    try {
        const { sales_order_id = "", store_id = "", priority = "", note = "", type = "", buyer_business_node_id = "", required_by_date = "", items = "", req_no = "" } = req.body;

        // if (!store_id) {
        //     await transaction.rollback()
        //     return res.status(400).json({ success: false, code: 400, message: "FG Store is required!!!" });
        // };
        if (items.length <= 0) {
            await transaction.rollback()
            return res.status(400).json({ success: false, code: 400, message: "Items fields are should not be empty!!!" });
        };

        /** check if salesOrder is exists or not */
        let salesOrder = null
        if (sales_order_id) {
            salesOrder = await SalesOrder.findByPk(Number(sales_order_id));
            if (!salesOrder) {
                await transaction.rollback()
                return res.status(404).json({ success: false, code: 404, message: "Sales Order not found!!!" });
            };

            salesOrder.status = "assign_fg";
            await salesOrder.save({ transaction });
        }

        /** only trigger if req_no is passed, and check if requisition is exists or not */
        let sellerBusinessNodeId = null;
        if (req_no) {
            const requisition = await Requisition.findOne({
                where: { requisition_no: req_no?.trim() }
            })
            if (!requisition) {
                await transaction.rollback()
                return res.status(404).json({ success: false, code: 404, message: "Requisition not found!!!" });
            }

            const reqSupplier = await RequisitionSupplier.findOne({ where: { requisition_id: Number(requisition.id) } });
            if (!reqSupplier) throw new Error("Requisition Supplier not found!!!");

            reqSupplier.status = "assign_fg";
            await reqSupplier.save({ transaction });

            requisition.status = "assign_fg";
            await requisition.save({ transaction });

            sellerBusinessNodeId = reqSupplier.supplier_business_node_id;
        }


        let store = null;
        if (store_id) {
            store = await ManufacturingUnit.findOne({
                where: {
                    id: Number(store_id),
                    store_type: "fg_store"
                }
            });
            if (!store) {
                await transaction.rollback()
                return res.status(404).json({ success: false, code: 404, message: "FG Store not found!!!" });
            }
        }

        // Step 1: Create Outward header
        const outward = await Outward.create({
            seller_business_node_id: store_id ? store.business_node_id : sellerBusinessNodeId,

            ...(salesOrder && { sales_order_id: salesOrder.id }),
            ...(store_id && { store_id: store.id }),
            buyer_business_node_id: salesOrder ? salesOrder.buyer_business_node_id : buyer_business_node_id,
            priority,
            type,
            note,

            ...(req_no && { pr_no: req_no }),
            required_by: new Date(salesOrder ? salesOrder.required_by : required_by_date),
            meta: salesOrder ? salesOrder.meta : null,
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
                ...(sales_order_item_id && { sales_order_item_id: Number(sales_order_item_id) }),
                vendor_product_id: product.id,
                requested_qty: Number(requested_qty),
                ...(unit_price && { unit_price: Number(unit_price) }),
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


// PUT
export const confirmAllocation = asyncHandler(async (req, res) => {
    const { Outward, OutwardItem, Product, OutwardAllocation, Batch, SalesOrder, Requisition } = req.dbModels;
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
                    mfg_date: batchRecord.mfg_date,
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


        if (outward.type === "external") {
            const salesOrder = await SalesOrder.findOne({ where: { id: outward.sales_order_id } });

            const invNo = await createInvoice(req, outward, salesOrder, allocatedItems, transaction);
            outward.invoice_no = invNo;

            await createGrn_items_external(salesOrder, allocatedItems, outward_no);
        } else {
            await createGrn_items_internal(req, transaction, outward, allocatedItems);

            const requisition = await Requisition.findOne({ where: { requisition_no: outward?.pr_no } })
            requisition.status = "dispatched";
            await requisition.save({ transaction });
        }

        /** update outward record */
        outward.dispatch_date = new Date();
        outward.status = "dispatched";
        await outward.save({ transaction });


        // await transaction.rollback()
        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Created successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});