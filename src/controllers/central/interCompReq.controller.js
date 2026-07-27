import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js"
import { generateNo } from "../../helper/generate.js";


/** allowed status transitions — assign is only reachable via FG store assignment */
const STATUS_FLOW = {
    pending: ["dispatched", "cancelled"],
    assign: ["dispatched", "cancelled"],
    dispatched: ["closed"],
    cancelled: [],
    closed: [],
};

/**
 * Attach tenant-local product details on every item using its product mapping.
 * side: "buyer" → resolve buyer_product_id | "vendor" → resolve vendor_product_id
 */
async function attachLocalProducts(rows, dbModels, side) {
    if (!dbModels?.Product || !rows?.length) return rows;

    const key = side === "vendor" ? "vendor_product_id" : "buyer_product_id";

    /** collect unique product ids across all items */
    const productIds = [...new Set(
        rows.flatMap(r => r.intercompanyItems || [])
            .map(item => item?.mappedProduct?.[key])
            .filter(Boolean)
    )];
    if (!productIds.length) return rows;

    const products = await dbModels.Product.findAll({
        where: { id: { [Op.in]: productIds } }
    });
    const productById = Object.fromEntries(products.map(p => [p.id, p.toJSON()]));

    for (const row of rows) {
        for (const item of row.intercompanyItems || []) {
            item.product = productById[item?.mappedProduct?.[key]] || null;
        }
    }
    return rows;
}


/**
 * Attach buyer/vendor tenant company details on every row's connection.
 * Resolves each tenant's root business node (node_type_code == null) with its node details.
 */
async function attachTenantNodeDetails(rows) {
    const validRows = (rows || []).filter(r => r?.icReqConnection);
    if (!validRows.length) return rows;

    /** collect unique tenant db names across all connections */
    const tenants = [...new Set(
        validRows.flatMap(r => [r.icReqConnection.buyer_tenant, r.icReqConnection.vendor_tenant]).filter(Boolean)
    )];

    /** resolve each tenant's root business node with details */
    const nodeByTenant = {};
    await Promise.all(tenants.map(async (tenant) => {
        try {
            const { models: { BusinessNode, NodeDetails } } = await getTenantConnection(tenant);
            const rootNode = await BusinessNode.findOne({
                where: {
                    node_type_code: null,
                    tenant_business_flow_id: null
                },
                include: [
                    {
                        model: NodeDetails,
                        as: "nodeDetails",
                        attributes: {
                            exclude: ["business_node_id", "createdAt", "updatedAt"]
                        }
                    }
                ]
            });
            nodeByTenant[tenant] = rootNode?.nodeDetails ? rootNode.nodeDetails.toJSON() : null;
        } catch (error) {
            console.log(`Failed to load node details for tenant: ${tenant}`, error.message);
            nodeByTenant[tenant] = null;
        }
    }));

    for (const row of validRows) {
        row.buyerDetails = nodeByTenant[row.icReqConnection.buyer_tenant] || null;
        row.vendorDetails = nodeByTenant[row.icReqConnection.vendor_tenant] || null;
    }
    return rows;
}


/**
 * Attach the requester's own acting business node on the requisition:
 * buyer side → buyerNode (the node that raised it),
 * vendor side → vendorNode (the node assigned to fulfil it, with its store when
 * one was selected — absent while pending, the outward only exists after assignment).
 * Each party only sees its own internal node — never the other side's.
 */
async function attachActingNodes(row, side) {
    const connection = row?.icReqConnection;
    if (!connection) return row;

    row.buyerNode = null;
    row.vendorNode = null;

    /** buyer node — who actually raised (bought) this requisition */
    if (side === "buyer" && row.buyer_node && connection.buyer_tenant) {
        try {
            const { models: { BusinessNode, NodeDetails } } = await getTenantConnection(connection.buyer_tenant);
            const node = await BusinessNode.findByPk(Number(row.buyer_node), {
                include: [
                    {
                        model: NodeDetails,
                        as: "nodeDetails",
                        attributes: {
                            exclude: ["business_node_id", "createdAt", "updatedAt"]
                        }
                    }
                ]
            });
            row.buyerNode = node ? node.toJSON() : null;
        } catch (error) {
            console.log(`Failed to load buyer node for tenant: ${connection.buyer_tenant}`, error.message);
        }
    }

    /** vendor node — resolved from the outward created at assignment */
    if (side === "vendor" && row.status !== "pending" && connection.vendor_tenant) {
        try {
            const { models: { Outward, BusinessNode, NodeDetails, ManufacturingUnit } } = await getTenantConnection(connection.vendor_tenant);
            const outward = await Outward.findOne({
                where: { pr_no: row.requisition_no },
                include: [
                    {
                        model: BusinessNode,
                        as: "sellerOutwardNode",
                        include: [
                            {
                                model: NodeDetails,
                                as: "nodeDetails",
                                attributes: {
                                    exclude: ["business_node_id", "createdAt", "updatedAt"]
                                }
                            }
                        ]
                    },
                    {
                        model: ManufacturingUnit,
                        as: "outwardStore",
                        attributes: ["id", "name", "store_type", "location"]
                    },
                ],
            });
            if (outward?.sellerOutwardNode) {
                row.vendorNode = outward.sellerOutwardNode.toJSON();
                row.vendorNode.store = outward.outwardStore ? outward.outwardStore.toJSON() : null;
            }
        } catch (error) {
            console.log(`Failed to load vendor node for tenant: ${connection.vendor_tenant}`, error.message);
        }
    }

    return row;
}


// GET
/** buyer side — trading requisitions sent by current tenant */
export const sentTradingRequisitionList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { IntercompanyRequisition, IntercompanyRequisitionItems, ProductMapping, Connection } = models;

    const tenant = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", requisition_no = "", title = "", status = "", priority = "all" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const requisition = await IntercompanyRequisition.findAndCountAll({
            distinct: true,
            where: {
                ...(id && { id: Number(id) }),
                ...(requisition_no?.trim() && { requisition_no: { [Op.iLike]: `%${requisition_no?.trim()}%` } }),
                ...(title?.trim() && { title: { [Op.iLike]: `%${title?.trim()}%` } }),
                ...(status !== "" && { status: status?.toLowerCase().trim() }),
                ...(priority?.toLowerCase().trim() !== "all" && { priority: priority?.toLowerCase().trim() }),
            },
            include: [
                {
                    model: Connection,
                    as: "icReqConnection",
                    required: true,
                    where: { buyer_tenant: tenant },
                },
                {
                    model: IntercompanyRequisitionItems,
                    as: "intercompanyItems",
                    include: [
                        {
                            model: ProductMapping,
                            as: "mappedProduct",
                        },
                    ],
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });

        /** attach buyer side product details + both tenants company details */
        const formattedRows = requisition.rows.map(r => r.toJSON());
        await attachLocalProducts(formattedRows, req.dbModels, "buyer");
        await attachTenantNodeDetails(formattedRows);

        /** pagination calculation */
        const totalItems = requisition.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formattedRows,
            pagination: {
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


/** vendor side — trading requisitions received by current tenant */
export const receiveTradingRequisitionList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { IntercompanyRequisition, IntercompanyRequisitionItems, ProductMapping, Connection } = models;

    const tenant = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", requisition_no = "", title = "", status = "", priority = "all" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const requisition = await IntercompanyRequisition.findAndCountAll({
            distinct: true,
            where: {
                ...(id && { id: Number(id) }),
                ...(requisition_no?.trim() && { requisition_no: { [Op.iLike]: `%${requisition_no?.trim()}%` } }),
                ...(title?.trim() && { title: { [Op.iLike]: `%${title?.trim()}%` } }),
                ...(status !== "" && { status: status?.toLowerCase().trim() }),
                ...(priority?.toLowerCase().trim() !== "all" && { priority: priority?.toLowerCase().trim() }),
            },
            include: [
                {
                    model: Connection,
                    as: "icReqConnection",
                    required: true,
                    where: { vendor_tenant: tenant },
                },
                {
                    model: IntercompanyRequisitionItems,
                    as: "intercompanyItems",
                    include: [
                        {
                            model: ProductMapping,
                            as: "mappedProduct",
                        },
                    ],
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });

        /** attach vendor side product details + both tenants company details */
        const formattedRows = requisition.rows.map(r => r.toJSON());
        await attachLocalProducts(formattedRows, req.dbModels, "vendor");
        await attachTenantNodeDetails(formattedRows);

        /** pagination calculation */
        const totalItems = requisition.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formattedRows,
            pagination: {
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


/** single trading requisition with items + connection */
export const getTradingRequisitionDetails = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { IntercompanyRequisition, IntercompanyRequisitionItems, ProductMapping, Connection, TenantsName, Tenant } = models;

    const tenant = req.headers["x-tenant-id"];

    try {
        const { id } = req.params;

        const requisition = await IntercompanyRequisition.findByPk(parseInt(id, 10), {
            include: [
                {
                    model: Connection,
                    as: "icReqConnection",
                    include: [
                        {
                            model: TenantsName,
                            as: "buyer",
                            include: [{
                                model: Tenant,
                                as: "tenantDetails",
                                where: { isOwner: true },
                                required: false,
                                attributes: ["id", "companyName", "email"]
                            }]
                        },
                        {
                            model: TenantsName,
                            as: "vendor",
                            include: [{
                                model: Tenant,
                                as: "tenantDetails",
                                where: { isOwner: true },
                                required: false,
                                attributes: ["id", "companyName", "email"]
                            }]
                        },
                    ]
                },
                {
                    model: IntercompanyRequisitionItems,
                    as: "intercompanyItems",
                    include: [
                        {
                            model: ProductMapping,
                            as: "mappedProduct",
                        },
                    ],
                },
            ],
        });
        if (!requisition) return res.status(404).json({ success: false, code: 404, message: "Trading requisition not found!!!" });

        const connection = requisition.icReqConnection;
        if (![connection?.buyer_tenant, connection?.vendor_tenant].includes(tenant)) {
            return res.status(403).json({ success: false, code: 403, message: "You are not a party of this requisition!!!" });
        }

        /** attach local product details based on requester side + both tenants company details */
        const side = connection.vendor_tenant === tenant ? "vendor" : "buyer";
        const [formatJSON] = [requisition.toJSON()];
        await attachLocalProducts([formatJSON], req.dbModels, side);
        await attachTenantNodeDetails([formatJSON]);
        await attachActingNodes(formatJSON, side);
        formatJSON.side = side;

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: formatJSON });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
/** vendor side — assign requisition to a location (with optional store) & create a pending outward on vendor tenant */
export const assignTradingRequisitionLocation = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { IntercompanyRequisition, IntercompanyRequisitionItems, ProductMapping, Connection } = models;
    const { Outward, OutwardItem, Product, ManufacturingUnit, BusinessNode } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const tenant = req.headers["x-tenant-id"];

    try {
        const { id = "", store_id = "", location_id = "" } = req.body;

        if (!id || (!store_id && !location_id)) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        const requisition = await IntercompanyRequisition.findByPk(parseInt(id, 10), {
            include: [
                { model: Connection, as: "icReqConnection" },
                {
                    model: IntercompanyRequisitionItems,
                    as: "intercompanyItems",
                    include: [
                        {
                            model: ProductMapping,
                            as: "mappedProduct",
                        },
                    ],
                },
            ],
        });
        if (!requisition) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Trading requisition not found!!!" });
        }

        /** only the vendor can assign */
        if (requisition.icReqConnection?.vendor_tenant !== tenant) {
            await transaction.rollback();
            return res.status(403).json({ success: false, code: 403, message: "Only vendor can assign this requisition!!!" });
        }

        /** only while pending */
        if (requisition.status !== "pending") {
            await transaction.rollback();
            return res.status(422).json({ success: false, code: 422, message: "Assignment not possible!!!" });
        }

        let sellerNodeId;
        let outwardStoreId = null;

        if (store_id) {
            /** store selected — resolve the store and use its business_node_id */
            const store = await ManufacturingUnit.findByPk(Number(store_id));
            if (!store) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Store not found!!!" });
            }
            sellerNodeId = store.business_node_id;
            outwardStoreId = store.id;
        } else {
            /** no store — location selected directly */
            const node = await BusinessNode.findByPk(Number(location_id));
            if (!node) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Location not found!!!" });
            }
            sellerNodeId = node.id;
        }

        /** Step 1: create outward header in pending state */
        const outward = await Outward.create({
            seller_business_node_id: sellerNodeId,
            store_id: outwardStoreId,
            buyer_business_node_id: requisition.buyer_node,
            type: "internal",
            priority: requisition.priority,
            note: requisition.notes,
            pr_no: requisition.requisition_no,
            ...(requisition.required_by_date && { required_by: new Date(requisition.required_by_date) }),
            meta: {
                trading: true,
                inter_comp_req_id: requisition.id,
                connection_id: requisition.connection_id,
                buyer_tenant: requisition.icReqConnection.buyer_tenant,
            },
        }, { transaction });

        outward.outward_no = generateNo("OUT", outward.id);
        await outward.save({ transaction });

        /** Step 2: create outward items from vendor side mapped products */
        for (const item of requisition.intercompanyItems) {
            const vendorProductId = item?.mappedProduct?.vendor_product_id;

            const product = vendorProductId ? await Product.findOne({ where: { id: Number(vendorProductId) } }) : null;
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Vendor product mapping not found!!!" });
            }

            await OutwardItem.create({
                outward_id: outward.id,
                vendor_product_id: product.id,
                requested_qty: Number(item.qty),
            }, { transaction });
        }

        /** mark requisition as assigned (central DB — outside tenant transaction) */
        await requisition.update({ status: "assign" });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Assigned Successfully." });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// PUT
/** buyer side — update requisition details (only while pending) */
export const updateTradingRequisition = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const { IntercompanyRequisition, IntercompanyRequisitionItems, Connection } = models;
    const rootTransaction = await rootSequelize.transaction();

    const tenant = req.headers["x-tenant-id"];

    try {
        const { id = "", title = "", notes = "", priority = "", required_by_date = "", items = [] } = req.body;

        const requisition = await IntercompanyRequisition.findByPk(parseInt(id, 10), {
            include: [{ model: Connection, as: "icReqConnection" }],
        });
        if (!requisition) {
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Trading requisition not found!!!" });
        }

        /** only the buyer can update */
        if (requisition.icReqConnection?.buyer_tenant !== tenant) {
            await rootTransaction.rollback();
            return res.status(403).json({ success: false, code: 403, message: "Only buyer can update this requisition!!!" });
        }

        /** only while pending */
        if (requisition.status !== "pending") {
            await rootTransaction.rollback();
            return res.status(422).json({ success: false, code: 422, message: "Updation not possible!!!" });
        }

        let updateDetails = {};
        if (title?.trim()) updateDetails.title = title.trim();
        if (notes !== "") updateDetails.notes = notes?.trim();
        if (priority) updateDetails.priority = priority.toLowerCase();
        if (required_by_date) updateDetails.required_by_date = required_by_date;

        if (Object.keys(updateDetails).length > 0) {
            await requisition.update(updateDetails, { transaction: rootTransaction });
        }

        /** update item qty */
        for (const item of items) {
            const { id: itemId = "", qty = "" } = item;
            if (!itemId || !qty || Number(qty) <= 0) throw new Error("Valid item id and qty are required!!!");

            const [isUpdate] = await IntercompanyRequisitionItems.update(
                { qty },
                {
                    where: { id: Number(itemId), inter_comp_req_id: requisition.id },
                    transaction: rootTransaction,
                }
            );
            if (!isUpdate) throw new Error(`Requisition item: ${itemId} not found!!!`);
        }

        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });
    } catch (error) {
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


/** both side — status transition (pending → dispatched/cancelled, dispatched → closed) */
export const updateTradingRequisitionStatus = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { IntercompanyRequisition, Connection } = models;

    const tenant = req.headers["x-tenant-id"];

    try {
        const { id = "", status = "" } = req.body;
        const nextStatus = status?.toLowerCase().trim();

        if (!id || !nextStatus) throw new Error("Required fields are missing!!!");

        const requisition = await IntercompanyRequisition.findByPk(parseInt(id, 10), {
            include: [{ model: Connection, as: "icReqConnection" }],
        });
        if (!requisition) return res.status(404).json({ success: false, code: 404, message: "Trading requisition not found!!!" });

        const connection = requisition.icReqConnection;
        if (![connection?.buyer_tenant, connection?.vendor_tenant].includes(tenant)) {
            return res.status(403).json({ success: false, code: 403, message: "You are not a party of this requisition!!!" });
        }

        /** validate transition */
        const allowed = STATUS_FLOW[requisition.status] || [];
        if (!allowed.includes(nextStatus)) {
            return res.status(422).json({ success: false, code: 422, message: `Status can not change from ${requisition.status} to ${nextStatus}!!!` });
        }

        /** validate side — vendor dispatches, buyer cancels/closes */
        const isVendor = connection.vendor_tenant === tenant;
        if (nextStatus === "dispatched" && !isVendor) {
            return res.status(403).json({ success: false, code: 403, message: "Only vendor can dispatch this requisition!!!" });
        }
        if (["cancelled", "closed"].includes(nextStatus) && isVendor) {
            return res.status(403).json({ success: false, code: 403, message: "Only buyer can cancel or close this requisition!!!" });
        }

        await requisition.update({ status: nextStatus });

        return res.status(200).json({ success: true, code: 200, message: "Status Updated Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// DELETE
/** buyer side — delete requisition (only while pending, items cascade) */
export const deleteTradingRequisition = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { IntercompanyRequisition, Connection } = models;

    const tenant = req.headers["x-tenant-id"];

    try {
        const { id } = req.params;

        const requisition = await IntercompanyRequisition.findByPk(parseInt(id, 10), {
            include: [{ model: Connection, as: "icReqConnection" }],
        });
        if (!requisition) return res.status(404).json({ success: false, code: 404, message: "Trading requisition not found!!!" });

        /** only the buyer can delete */
        if (requisition.icReqConnection?.buyer_tenant !== tenant) {
            return res.status(403).json({ success: false, code: 403, message: "Only buyer can delete this requisition!!!" });
        }

        /** only while pending */
        if (requisition.status !== "pending") {
            return res.status(422).json({ success: false, code: 422, message: "Deletion not possible!!!" });
        }

        await requisition.destroy();

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});
