import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js"


/**
 * Attach the supplier's own product on every RFQ item, resolved through the product
 * mapping saved when they first quoted this buyer (see createRfqQuotation).
 *
 * From the second transaction onward the supplier no longer re-picks the same
 * products — the UI pre-selects and locks the mapped one. Items with no mapping
 * yet keep vendor_product = null so they stay free to choose.
 */
async function attachMappedVendorProducts(row, connection, ProductMapping, dbModels) {
    const items = row?.items ?? [];
    if (!items.length) return row;

    /** default — an unmapped item must stay selectable */
    for (const item of items) item.vendor_product = null;

    if (!connection || !dbModels?.Product) return row;

    try {
        const buyerProductIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
        if (!buyerProductIds.length) return row;

        const mappings = await ProductMapping.findAll({
            where: {
                connection_id: connection.id,
                buyer_product_id: { [Op.in]: buyerProductIds },
            }
        });
        if (!mappings.length) return row;

        const vendorProductIdByBuyerProduct = Object.fromEntries(
            mappings.map(m => [m.buyer_product_id, m.vendor_product_id])
        );

        /** the mapped products live in the supplier's own tenant db */
        const { Product } = dbModels;
        const products = await Product.findAll({
            where: { id: { [Op.in]: [...new Set(Object.values(vendorProductIdByBuyerProduct))] } }
        });
        const productById = Object.fromEntries(products.map(p => [p.id, p.toJSON()]));

        for (const item of items) {
            const vendorProductId = vendorProductIdByBuyerProduct[item.product_id];
            item.vendor_product = vendorProductId ? productById[vendorProductId] ?? null : null;
        }
    } catch (error) {
        /** never fail the listing over a mapping lookup — items simply stay unmapped */
        console.log("Product mapping lookup failed:", error?.message);
    }
    return row;
}


// GET
export const allRfqList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem, ProductMapping, Connection } = models;

    const tenant = req.headers["x-tenant-id"];
    // console.log(dbName)

    try {
        let { page = 1, limit = 10, id = "", rfq_no = "", location = "", company = "", status = "", priority = "all" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const rfq = await RFQ.findAndCountAll({
            distinct: true,
            where: {
                ...(id && { id: Number(id) }),
                ...(priority?.toLowerCase().trim() !== "all" && { priority: priority?.toLowerCase().trim() }),
                ...(rfq_no?.trim() && { rfq_no: { [Op.iLike]: `%${rfq_no?.trim()}%` } }),
                ...(status !== "" && { status: status?.toLowerCase().trim() }),
                ...(company?.trim() && { "meta.name": { [Op.iLike]: `%${company.trim()}%` } }),
                ...(location?.trim() && { "meta.nodeDetails.location": { [Op.iLike]: `%${location.trim()}%` } }),
            },
            include: [
                {
                    model: RFQItem,
                    as: "items",
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });
        if (!rfq) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        /** attaching vendor product id */
        const formattedRows = await Promise.all(rfq.rows.map(async (item) => {
            const formatJSON = item.toJSON();
            // console.log(formatJSON)

            const buyer_tenant = formatJSON.buyer_tenant;
            let connections = [];
            // Only look up a connection when both tenants exist and are different
            if (tenant && buyer_tenant && String(buyer_tenant) !== String(tenant)) {
                try {
                    connections = await Connection.findAll({
                        where: {
                            // match the pair {buyer_tenant, tenant} in either direction
                            [Op.or]: [
                                { buyer_tenant, vendor_tenant: tenant },
                                { buyer_tenant: tenant, vendor_tenant: buyer_tenant },
                            ],
                        }
                    });
                } catch (err) {
                    console.log("Connection lookup failed:", err?.message);
                    connections = [];
                }
            }

            /** attach product details */
            const { models } = await getTenantConnection(buyer_tenant)

            for (const item of formatJSON.items) {
                item.details = await models.Product.findByPk(
                    Number(item?.product_id),
                    { attributes: ["package_type", "measure", "sku", "unit_type"] }
                );
            }


            /**
             * Only a supplier connection qualifies on the open forum — the current tenant
             * must be the vendor (supplier) of the RFQ owner. Any other type (trader,
             * distributor, …) means the pair is connected, but not in a direction that
             * allows quoting this RFQ.
             */
            const supplierConnection = connections.find(c =>
                c.connection_type === "supplier"
                && c.connection_status
                && String(c.buyer_tenant) === String(buyer_tenant)
                && String(c.vendor_tenant) === String(tenant)
            );
            const activeConnection = connections.find(c => c.connection_status && c.connection_type !== "pending");
            const pendingConnection = connections.find(c => c.connection_type === "pending");

            /**
             * The connection product mappings are saved against — must mirror the lookup in
             * createRfqQuotation ({ buyer_tenant: rfq owner, vendor_tenant: me, active }),
             * otherwise mappings written on the first quotation would never be found here.
             */
            const quotingConnection = connections.find(c =>
                c.connection_status
                && String(c.buyer_tenant) === String(buyer_tenant)
                && String(c.vendor_tenant) === String(tenant)
            );

            formatJSON.isConnected = Boolean(supplierConnection);
            /** connection_status carries the connection type — null when no connection exists at all */
            formatJSON.connection_status = (supplierConnection ?? activeConnection ?? pendingConnection)?.connection_type ?? null;

            await attachMappedVendorProducts(formatJSON, quotingConnection, ProductMapping, req?.dbModels);

            return formatJSON;
        }));


        /** pagination calculation */
        const totalItems = rfq.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formattedRows,
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


// POST
/** create Requesition(EX) == RFQ */


// DELETE
const deleteRequisition = asyncHandler(async (req, res) => {
    const { Requisition } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await Requisition.destroy({
            where: { id: parseInt(id, 10) },
        });
        if (!isDeleted) return res.status(503).json({ success: false, code: 503, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


const updateRequisition = asyncHandler(async (req, res) => {
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