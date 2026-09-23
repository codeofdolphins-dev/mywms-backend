import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllowedBusinessNodes } from "../services/businessNode.service.js";
import { generateNo } from "../helper/generate.js";
import { getTenantConnection, rootDB } from "../db/tenantMenager.service.js"
import { fetchNodeDetails } from "../helper/helper.js";


// GET
export const allRequisitionList = asyncHandler(async (req, res) => {
    const { models: { RFQ, RfqQuotation } } = await rootDB()

    const { Requisition, RequisitionItem, User, Product, UnitType, PackageType } = req.dbModels;
    const current_node = req.activeNode;

    try {
        let { page = 1, limit = 10, id = "", requisition_no = "", title = "", isAdmin = false, sortBy = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const requisition = await Requisition.findAndCountAll({
            distinct: true,
            where: {
                ...(id && { id: Number(id) }),
                ...(requisition_no && { requisition_no }),
                ...(title && { title }),
                ...(!isAdmin && { buyer_business_node_id: current_node }),
                ...(sortBy && {
                    [Op.or]: [
                        { priority: sortBy.toLowerCase() },
                        { status: sortBy.toLowerCase() },
                    ],
                }),
            },
            include: [
                {
                    model: User,
                    as: "createdBy",
                },
                {
                    model: RequisitionItem,
                    as: "items",
                    attributes: {
                        exclude: ["requisition_id"],
                    },
                    required: false,
                    include: [
                        {
                            model: Product,
                            as: "product",
                            required: false,
                            include: [
                                {
                                    model: UnitType,
                                    as: "unitRef",
                                    required: false,
                                },
                                {
                                    model: PackageType,
                                    as: "packageType",
                                    required: false,
                                },
                            ],
                        },
                    ],
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });
        if (!requisition)
            return res.status(500).json({
                success: false,
                code: 500,
                message: "Fetched failed!!!",
            });

        const totalItems = requisition.count;
        const totalPages = Math.ceil(totalItems / limit);


        /** format object */
        const formattedRequisitions = await Promise.all(requisition.rows.map(async (rr) => {
            const formatJSON = rr.toJSON();

            const reqNo = formatJSON?.requisition_no;

            const rfq = await RFQ.findOne({
                where: {
                    pr_reference_code: reqNo,
                },
                include: [
                    {
                        model: RfqQuotation,
                        as: "rfqQuotations"
                    }
                ]
            });

            formatJSON.isAnyQuotation = rfq?.rfqQuotations?.length > 0 ? true : false;
            formatJSON.receiveQuotationCount = rfq?.rfqQuotations?.length ?? 0;
            return formatJSON;
        }));

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formattedRequisitions,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


/** GET all receive requisition list  */
export const allReceiveRequisitionList = asyncHandler(async (req, res) => {

    const { BusinessNode, Requisition, NodeDetails, RequisitionItem, Product, UnitType, PackageType } = req.dbModels;

    const current_node = req.activeNode;

    try {
        let { page = 1, limit = 10, id = "", requisition_no = "", title = "", sortBy = "" } = req.query;

        limit = Number(limit);
        const offset = (Number(page) - 1) * limit;

        const { count, rows } = await Requisition.findAndCountAll({
            distinct: true,
            subQuery: false,
            include: [
                {
                    model: BusinessNode,
                    as: "supplierBusinessNode",
                    required: true,
                    where: {
                        id: current_node,
                    },
                    through: {
                        attributes: ["status", "createdAt"]
                    },
                },
            ],

            where: {
                ...(id && { id: Number(id) }),
                ...(requisition_no && { requisition_no }),
                ...(title && { title }),
                ...(sortBy && {
                    [Op.or]: [
                        { priority: sortBy.toLowerCase() },
                        { status: sortBy.toLowerCase() },
                    ],
                }),
            },
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });

        // No data guard
        if (!rows.length) {
            return res.status(200).json({
                success: true,
                code: 200,
                message: "No Requisition List Found.",
                data: [],
                pagination: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            });
        }

        const requisitionIds = rows.map(r => r.id);

        // STEP 2: Load full requisition graph
        const requisitions = await Requisition.findAll({
            where: {
                id: requisitionIds,
            },
            attributes: {
                exclude: ["status"]
            },
            include: [
                {
                    model: BusinessNode,
                    as: "supplierBusinessNode",
                    required: true,
                    where: {
                        id: current_node,
                    },
                    attributes: ["id"],
                    through: {
                        attributes: ["status", "createdAt"],
                    },
                },
                {
                    model: BusinessNode,
                    as: "buyer",
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails",
                        }
                    ]
                },
                {
                    model: RequisitionItem,
                    as: "items",
                    required: false,
                    include: [
                        {
                            model: Product,
                            as: "product",
                            include: [
                                { model: UnitType, as: "unitRef" },
                                { model: PackageType, as: "packageType" },
                            ],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });


        if (!requisitions) {
            return res.status(500).json({
                success: false,
                code: 500,
                message: "Fetched failed!!!",
            });
        }

        const totalItems = count;
        const totalPages = Math.ceil(totalItems / limit);

        const formattedRequisitions = requisitions.map(req => {
            const plain = req.toJSON();

            // Extract status safely
            const supplierStatus = plain.supplierBusinessNode?.[0]?.RequisitionSupplier?.status || null;

            // Remove supplierBusinessNode
            delete plain.supplierBusinessNode;

            return {
                ...plain,
                status: supplierStatus,
            };
        });


        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formattedRequisitions,
            pagination: {
                total: totalItems,
                page,
                limit,
                totalPages,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


/** allow nodes */
export const getCreateRequisitionContext = asyncHandler(async (req, res) => {
    const models = req.dbModels;

    try {
        const allowNode = await getAllowedBusinessNodes(
            req.activeNode,
            models,
        );

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: allowNode,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createInternalRequisition = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, Product, BusinessNode } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    // console.log(req.body); return

    try {
        const { title = "", vendor_id = [], required_by_date = "", priority = "", notes = "", items = [], } = req.body;
        const userDetails = req.user;
        const current_node = req.activeNode;

        if (items?.length < 1 || vendor_id?.length < 1) throw new Error("Required fields are missing!!!");

        // fetch all supplier nodes
        const vendorNode = await BusinessNode.findAll({
            where: { id: { [Op.in]: vendor_id } }
        });
        if (vendorNode.length != vendor_id.length) throw new Error("Some supplier records not found");

        // for (const i of supplierNode) {
        //     console.log(i.toJSON());
        //     return;
        // }

        const allowNodes = await getAllowedBusinessNodes(current_node, req.dbModels, false);

        // check if at least one supplier node is allowed
        const isAllowed = vendorNode.some(supplier =>
            allowNodes.some(allowed => allowed.id === supplier.id)
        );
        if (!isAllowed) {
            await transaction.rollback();
            return res.status(403).json({ success: false, code: 403, message: "You are not allowed to create requisition" });
        }

        const requisition = await Requisition.create({
            buyer_business_node_id: current_node,
            ...(required_by_date && { required_by_date: new Date(required_by_date) }),
            ...(title && { title: title.trim() }),
            notes,
            type: "internal",
            ...(priority && { priority: priority.toLowerCase() }),
            created_by: parseInt(userDetails.id, 10),
        }, { transaction });

        const requisition_no = generateNo("REQ", requisition.id);

        await requisition.update({
            requisition_no,
        }, { transaction });

        /** push all supplier id into join table (requisitionSupplier) */
        await requisition.addSupplierBusinessNode(
            vendorNode.map(node => node.node_type_code === "L-101" ? 1 : node.id),
            {
                through: {
                    status: "sent",
                },
                transaction,
            }
        );

        for (const item of items) {
            if (!item.barcode) throw new Error("barcode is required!!!");

            const product = await Product.findOne({
                where: { barcode: item.barcode },
            });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: `Product with barcode: ${item.barcode} not found` });
            }

            await RequisitionItem.create(
                {
                    requisition_id: requisition.id,
                    product_id: product.id,
                    ...(item.brand && { brand: item.brand }),
                    ...(item.category && { category: item.category }),
                    ...(item.subCategory && { sub_category: item.subCategory }),
                    qty: item.reqQty,
                    // price_limit: item.priceLimit
                },
                { transaction }
            );
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Requisition Created." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const createOpenForumRequisition = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const { RFQ, RFQItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const { Requisition, RequisitionItem, Product, RequisitionCategory } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const dbName = req.headers["x-tenant-id"];
    // console.log(req.body); return

    try {
        const { title = "", requisition_category_id = "", required_by_date = "", priority = "", notes = "", total = "", items = "", limit_type = "" } = req.body;
        const userDetails = req.user;
        const current_node = req.activeNode;

        // console.log(current_node); return

        if (items?.length < 1) throw new Error("Required fields are missing!!!");

        const rCat = await RequisitionCategory.findByPk(Number(requisition_category_id));

        const requisition = await Requisition.create({
            buyer_business_node_id: current_node,
            ...(title && { title: title.trim() }),
            notes: notes?.trim(),
            ...(total !== "" && { grandTotal: total }),
            requisition_category_id: rCat?.id,
            type: "external",
            ...(required_by_date && { required_by_date: new Date(required_by_date) }),
            created_by: parseInt(userDetails.id, 10),
            ...(limit_type !== "" && { price_limit_type: limit_type.toLowerCase() }),
            ...(priority && { priority: priority.toLowerCase() }),
        }, { transaction });

        // update requisition no field
        const requisition_no = generateNo("EX-REQ", requisition.id)
        await requisition.update({ requisition_no }, { transaction });

        const nodeDetails = await fetchNodeDetails(req.dbModels, current_node);

        const rfq = await RFQ.create({
            buyer_tenant: dbName,
            pr_reference_code: requisition_no,
            ...(title && { title: title.trim() }),
            ...(priority && { priority: priority.toLowerCase() }),
            note: notes?.trim(),
            status: "open",
            ...(required_by_date && { submission_deadline: new Date(required_by_date) }),
            ...(total !== "" && { grand_total: total }),
            meta: nodeDetails
        }, { transaction: rootTransaction });
        await rfq.update({ rfq_no: generateNo("RFQ", rfq.id) }, { transaction: rootTransaction });


        for (const item of items) {
            const { id = "", priceLimit = "", reqQty = "" } = item;
            if ([id, reqQty, priceLimit].some(i => i === "")) throw new Error("required fields are missing!!!");

            const product = await Product.findByPk(Number(id));
            if (!product) {
                await transaction.rollback();
                await rootTransaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: `Product with barcode: ${item.barcode} not found` });
            }

            // create record in requisition item model
            await RequisitionItem.create({
                requisition_id: requisition.id,
                product_id: product.id,
                brand: item.brand,
                category: item.category,
                sub_category: item.subCategory,
                qty: item.reqQty,
                price_limit: item.priceLimit
            }, { transaction });

            await RFQItem.create({
                rfq_id: rfq.id,
                product_id: product.id,
                product_name: product.name,
                qty: item.reqQty,
                uom: product.unit_type,
                ...(limit_type !== "" && { price_limit_type: limit_type.toLowerCase() }),
                price_limit: item.priceLimit,
            }, { transaction: rootTransaction });
        }

        await transaction.commit();
        await rootTransaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Requisition Created." });

    } catch (error) {
        await transaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const createTradingRequisition = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const { IntercompanyRequisition, IntercompanyRequisitionItems, Connection, ProductMapping } = models;
    const rootTransaction = await rootSequelize.transaction();

    const { Vendor } = req.dbModels;
    const dbName = req.headers["x-tenant-id"];

    // console.log(req.body); return

    /** opened on the vendor tenant once the connection is resolved */
    let sellerTransaction = null;

    /** on an early return either transaction may already be finished */
    const rollbackAll = async () => {
        for (const t of [sellerTransaction, rootTransaction]) {
            if (!t) continue;
            try { await t.rollback(); } catch { /* already finished */ }
        }
    };

    try {
        const { title = "", vendor_id = "", buyer_node = "", seller_node = "", seller_store_id = "", required_by_date = "", priority = "", notes = "", total = "", items = [] } = req.body;
        const userDetails = req.user;
        const current_node = Number(buyer_node) || req.activeNode;

        if (!vendor_id || !seller_node || items?.length < 1) throw new Error("Required fields are missing!!!");

        /** fetch vendor (tenant level) to resolve its root connection */
        const vendor = await Vendor.findByPk(Number(vendor_id));
        if (!vendor) {
            await rollbackAll();
            return res.status(404).json({ success: false, code: 404, message: "Vendor not found!!!" });
        }

        /** validate connection (root level) */
        const connection = await Connection.findByPk(Number(vendor.connection_id));
        if (!connection) {
            await rollbackAll();
            return res.status(404).json({ success: false, code: 404, message: "Connection with vendor not found!!!" });
        }
        if (connection.connection_type === "pending") {
            await rollbackAll();
            return res.status(403).json({ success: false, code: 403, message: "Connection with vendor is not active!!!" });
        }
        /** product mapping is buyer directional — only the buyer side can raise this */
        if (connection.buyer_tenant !== dbName) {
            await rollbackAll();
            return res.status(403).json({ success: false, code: 403, message: "Only buyer can raise a trading requisition!!!" });
        }

        /** resolve product mappings before creating anything */
        const mappedItems = [];
        for (const item of items) {
            const { productId = "", reqQty = "" } = item;
            if (!productId || !reqQty || Number(reqQty) <= 0) throw new Error("productId and valid reqQty are required for every item!!!");

            const productMapping = await ProductMapping.findOne({
                where: {
                    connection_id: connection.id,
                    buyer_product_id: Number(productId),
                }
            });
            if (!productMapping) {
                await rollbackAll();
                return res.status(404).json({ success: false, code: 404, message: `Product: ${item.productName || productId} is not mapped with this vendor!!!` });
            }

            mappedItems.push({ item, mapping: productMapping });
        }

        /**
         * The buyer selects the seller location while raising the requisition, so the
         * outward is created here instead of waiting for a vendor side assignment.
         */
        const { sequelize: sellerSequelize, models: sellerModels } = await getTenantConnection(connection.vendor_tenant);
        const { Outward, OutwardItem, Product: SellerProduct, BusinessNode: SellerBusinessNode, ManufacturingUnit: SellerStore } = sellerModels;

        /** the selected location must be a node of the vendor tenant */
        const sellerNode = await SellerBusinessNode.findByPk(Number(seller_node));
        if (!sellerNode) {
            await rollbackAll();
            return res.status(404).json({ success: false, code: 404, message: "Seller location not found!!!" });
        }

        /**
         * A location with FG stores (manufacturing node) only sees outwards through its stores,
         * so the outward must land on one of them — a store-less outward would be visible to nobody there.
         */
        const sellerFgStores = await SellerStore.findAll({
            where: { business_node_id: sellerNode.id, store_type: "fg_store" },
            attributes: ["id"]
        });

        let sellerStoreId = null;
        if (sellerFgStores.length) {
            sellerStoreId = Number(seller_store_id) || null;
            if (!sellerStoreId) {
                await rollbackAll();
                return res.status(400).json({ success: false, code: 400, message: "FG store of the seller location is required!!!" });
            }
            if (!sellerFgStores.some(store => store.id === sellerStoreId)) {
                await rollbackAll();
                return res.status(404).json({ success: false, code: 404, message: "FG store not found at the seller location!!!" });
            }
        }

        /** resolve the vendor side product of every mapping before creating anything */
        for (const mapped of mappedItems) {
            const sellerProduct = mapped.mapping.vendor_product_id
                ? await SellerProduct.findByPk(Number(mapped.mapping.vendor_product_id))
                : null;
            if (!sellerProduct) {
                await rollbackAll();
                return res.status(404).json({ success: false, code: 404, message: `Vendor product mapping not found for: ${mapped.item.productName || mapped.item.productId}!!!` });
            }
            mapped.seller_product_id = sellerProduct.id;
        }

        sellerTransaction = await sellerSequelize.transaction();

        /** create intercompany requisition — already assigned, its outward exists from the start */
        const requisition = await IntercompanyRequisition.create({
            connection_id: connection.id,
            buyer_node: current_node,
            seller_node: sellerNode.id,
            ...(title && { title: title.trim() }),
            notes: notes?.trim(),
            total_price: Number(total || 0),
            status: "assign",
            ...(required_by_date && { required_by_date }),
            ...(priority && { priority: priority.toLowerCase() }),
            created_by: parseInt(userDetails.id, 10),
        }, { transaction: rootTransaction });

        // update requisition no field
        const requisition_no = generateNo("TR-REQ", requisition.id);
        await requisition.update({ requisition_no }, { transaction: rootTransaction });

        /** create requisition items */
        for (const { item, mapping } of mappedItems) {
            await IntercompanyRequisitionItems.create({
                inter_comp_req_id: requisition.id,
                product_mapping_id: mapping.id,
                qty: item.reqQty,
                line_total_price: Number(item.reqQty) * Number(item?.mrp),
                ...(item.brand && { brand: item.brand }),
                ...(item.category && { category: item.category }),
                ...(item.subCategory && { sub_category: item.subCategory }),
            }, { transaction: rootTransaction });
        }

        /** create the pending outward on the vendor tenant */
        const outward = await Outward.create({
            seller_business_node_id: sellerNode.id,
            store_id: sellerStoreId,
            buyer_business_node_id: current_node,
            type: "internal",
            priority: requisition.priority,
            note: requisition.notes,
            pr_no: requisition_no,
            total_price: Number(total || 0),
            ...(required_by_date && { required_by: new Date(required_by_date) }),
            meta: {
                trading: true,
                inter_comp_req_id: requisition.id,
                connection_id: connection.id,
                buyer_tenant: connection.buyer_tenant,
            },
        }, { transaction: sellerTransaction });

        outward.outward_no = generateNo("OUT", outward.id);
        await outward.save({ transaction: sellerTransaction });

        /** create outward items from the vendor side of each mapping */
        for (const { item, seller_product_id } of mappedItems) {
            await OutwardItem.create({
                outward_id: outward.id,
                vendor_product_id: seller_product_id,
                requested_qty: Number(item.reqQty),
                line_total_price: Number(item.reqQty) * Number(item?.mrp),
            }, { transaction: sellerTransaction });
        }

        await sellerTransaction.commit();
        await rootTransaction.commit();

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Trading Requisition Created.",
            data: { id: requisition.id, requisition_no, outward_no: outward.outward_no },
        });

    } catch (error) {
        await rollbackAll();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});










// DELETE
export const deleteRequisition = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id } = req.params;

        const requisition = await Requisition.findByPk(parseInt(id, 10));
        if (!requisition) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Requisition not found!!!" });
        }

        // If the requisition is external, also delete from the root DB
        if (requisition.type === "external") {
            const { rootSequelize, models } = await rootDB();
            const { RFQ } = models;
            const rootTransaction = await rootSequelize.transaction();

            try {
                // Find the corresponding RFQ using the pr_reference_code
                const rfq = await RFQ.findOne({
                    where: { pr_reference_code: requisition.requisition_no },
                    transaction: rootTransaction,
                });

                if (rfq) {
                    // Delete the RFQ record
                    await RFQ.destroy({
                        where: { id: rfq.id },
                        transaction: rootTransaction,
                    });
                }

                // Delete the requisition from tenant DB
                await Requisition.destroy({
                    where: { id: parseInt(id, 10) },
                    transaction,
                });

                await transaction.commit();
                await rootTransaction.commit();

                return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });
            } catch (error) {
                await transaction.rollback();
                await rootTransaction.rollback();
                throw error;
            }
        }

        // For non-external (internal) requisitions, just delete from tenant DB
        const isDeleted = await Requisition.destroy({
            where: { id: parseInt(id, 10) },
            transaction,
        });

        if (!isDeleted) {
            await transaction.rollback();
            return res.status(503).json({ success: false, code: 503, message: "Deletion failed!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });
    } catch (error) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const updateRequisition = asyncHandler(async (req, res) => {
    const { Requisition } = req.dbModels;
    try {
        const {
            id = "",
            title = "",
            status = "",
            priority = "",
            notes = "",
        } = req.body;

        const requisition = await Requisition.findByPk(parseInt(id, 10));
        if (!requisition)
            return res.status(404).json({
                success: false,
                code: 404,
                message: "No requisition record found!!!",
            });

        const currentStatus = requisition.status;

        if (["draft", "submitted"].some((item) => item === currentStatus)) {
            let updateDetails = {};
            if (title) updateDetails.title = title;
            if (status) updateDetails.status = status;
            if (priority) updateDetails.priority = priority;
            if (notes) updateDetails.notes = notes;

            const isUpdate = await Requisition.update(updateDetails, {
                where: { id },
            });
            if (!isUpdate)
                return res.status(503).json({
                    success: false,
                    code: 503,
                    message: "Updation failed!!!",
                });

            return res.status(200).json({
                success: true,
                code: 200,
                message: "Updated Successfully.",
            });
        }
        return res.status(422).json({
            success: false,
            code: 422,
            message: "Updation not possible!!!",
        });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, code: 500, message: error.message });
    }
});

export const updateRequisitionItems = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, Unit } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const {
            id = "",
            description = "",
            quantity = "",
            uom_id = "",
            unit_price_estimate = "",
        } = req.body;
        if (!id) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                code: 400,
                message: "Id must required!!!",
            });
        }

        let updateDetails = {};
        if (description) updateDetails.description = description;
        if (quantity) updateDetails.quantity = quantity;
        if (uom_id) {
            const uom = await Unit.findByPk(parseInt(uom_id, 10));
            if (!uom) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    code: 404,
                    message: `Unit of messure record not found`,
                });
            }
            updateDetails.uom_id = uom.id;
        }
        if (unit_price_estimate)
            updateDetails.unit_price_estimate = unit_price_estimate;

        const requisitionItem = await RequisitionItem.findOne({
            where: { id: parseInt(id, 10) },
        });
        if (!requisitionItem) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                code: 404,
                message: "Record not found!!!",
            });
        }

        const [isUpdate] = await RequisitionItem.update(updateDetails, {
            where: { id: parseInt(id, 10) },
            transaction,
        });
        if (!isUpdate) {
            await transaction.rollback();
            return res.status(500).json({
                success: false,
                code: 500,
                message: "Updation failed!!!",
            });
        }

        if (unit_price_estimate) {
            const requisition = await Requisition.findByPk(
                requisitionItem.requisition_id,
                { transaction },
            );

            const total =
                parseInt(requisition.total) -
                parseInt(requisitionItem.unit_price_estimate) +
                parseInt(unit_price_estimate);

            await Requisition.update(
                { total },
                { where: { id: requisition.id }, transaction },
            );
        }
        await transaction.commit();
        return res.status(200).json({
            success: true,
            code: 200,
            message: "Updated Successfully.",
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res
            .status(500)
            .json({ success: false, code: 500, message: error.message });
    }
});