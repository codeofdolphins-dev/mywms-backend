import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js";
import { generateNo } from "../../helper/generate.js";


// GET
export const allBlanketOrderList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem, TenantsName, Tenant } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", bpo_no = "", status = "all", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const blanketOrder = await BlanketOrder.findAndCountAll({
            distinct: true,
            where: {
                ...(id && { id: Number(id) }),
                ...(bpo_no && { bpo_no: bpo_no.trim() }),
                [Op.or]: [
                    { buyer_tenant: dbName },
                    { vendor_tenant: dbName }
                ],
                ...(status !== "all" && { status: status.toLowerCase() }),
            },
            include: [
                {
                    model: BlanketOrderItem,
                    as: "blanketOrderItems",
                },
                {
                    model: TenantsName,
                    as: "buyer",
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                            // attributes: ["companyName"]
                        }
                    ]
                },
                {
                    model: TenantsName,
                    as: "vendor",
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                            // attributes: ["companyName"]
                        }
                    ]
                },
            ],
            limit,
            offset,
            ...(!noLimit && { order: [['createdAt', 'DESC']] })
        });
        if (!blanketOrder) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = blanketOrder.count;
        const totalPages = Math.ceil(totalItems / limit);

        const formateData = await Promise.all(blanketOrder.rows?.map(async (row) => {
            const i = row.toJSON();

            const buyerConnection = i.buyer_tenant ? await getTenantConnection(i.buyer_tenant).catch(() => null) : null;
            const vendorConnection = i.vendor_tenant ? await getTenantConnection(i.vendor_tenant).catch(() => null) : null;

            i.blanketOrderItems = await Promise.all((i.blanketOrderItems || [])?.map(async (a) => {
                const buyer_product = (buyerConnection && a.buyer_product_id)
                    ? await buyerConnection.models.Product.findByPk(a.buyer_product_id, { attributes: ["id", "name", "barcode"] }).catch(() => null)
                    : null;
                const vendor_product = (vendorConnection && a.vendor_product_id)
                    ? await vendorConnection.models.Product.findByPk(a.vendor_product_id, { attributes: ["id", "name", "barcode"] }).catch(() => null)
                    : null;

                return {
                    ...a,
                    buyer_product: buyer_product ? buyer_product.toJSON() : null,
                    vendor_product: vendor_product ? vendor_product.toJSON() : null
                };
            }));
            return i;
        }))

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: (id || bpo_no || noLimit) ? formateData?.[0] : formateData,
            ...(!(id || bpo_no || noLimit) && {
                pagenation: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            }),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
export const createSupplierConnection = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const rootTransaction = await rootSequelize.transaction();
    const { Connection } = models;

    const vendor_tenant = req?.headers["x-tenant-id"];

    // console.log(req.body); return
    try {
        const { buyer_tenant, connection_type } = req.body;
        if (!buyer_tenant || !connection_type) {
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        if (connection_type !== "supplier") throw new Error("Connection type not matching!!!");

        const exist = await Connection.findOne({
            where: {
                buyer_tenant,
                vendor_tenant,
                connection_type,
            }
        });
        if (exist) throw new Error("Record already exist!!!");

        const connection = await Connection.create({
            buyer_tenant,
            vendor_tenant,
            connection_type
        }, { transaction: rootTransaction });

        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Successfully created Supplier connection", data: connection });

    } catch (error) {
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const createTraderConnection = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    // console.log(req.body); return

    const { RFQ, BlanketOrder, BlanketOrderItem, RfqQuotationRevision, RfqQuotation, ProductMapping } = models;
    const rootTransaction = await rootSequelize.transaction();

    const { Requisition } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { rfq_id = "", rfq_quotation_revision_id = "", buyer_tenant = "", vendor_tenant = "", valid_until = "", items = "", pr_reference_code = "" } = req.body;
        if ([rfq_id, rfq_quotation_revision_id, buyer_tenant, vendor_tenant, items, pr_reference_code].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const revision = await RfqQuotationRevision.findByPk(Number(rfq_quotation_revision_id));
        if (!revision) {
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        };

        /** check RFQ Quotation */
        const quotation = await RfqQuotation.findByPk(revision.quotation_id);
        if (!quotation) {
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Quotation record not found!!!" });
        }
        quotation.status = "accept";
        await quotation.save({ transaction: rootTransaction });

        revision.status = "confirmed";
        await revision.save({ transaction: rootTransaction });

        /** create blanket order */
        const blanketOrder = await BlanketOrder.create({
            buyer_tenant,
            vendor_tenant,
            rfq_quotation_revision_id,
            pr_reference_code,
            status: "active",
            ...(valid_until && { valid_until: new Date(valid_until) })
        }, { transaction: rootTransaction });
        if (!blanketOrder) throw new Error("Record not created!!!");

        blanketOrder.bpo_no = generateNo("BPO", blanketOrder.id);
        await blanketOrder.save({ transaction: rootTransaction });

        /** create blanket order items */
        for (const item of items) {
            const { buyer_product_id = "", unit_price = "", total_contracted_qty = "", product_map_id = "" } = item;

            if ([buyer_product_id, unit_price, total_contracted_qty, product_map_id].some(i => i === "")) throw new Error("Required fields are missing in items array!!!");

            const productMapping = await ProductMapping.findByPk(Number(product_map_id));
            if (!productMapping) {
                await rootTransaction.rollback();
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Product Mapping record not found!!!" });
            }

            await BlanketOrderItem.create({
                bpo_id: blanketOrder.id,
                buyer_product_id: buyer_product_id,
                vendor_product_id: productMapping.vendor_product_id,
                total_contracted_qty,
                remain_contracted_qty: total_contracted_qty,
                unit_price,
            }, { transaction: rootTransaction });
        };

        /** update RFQ status to closed */
        const rfq = await RFQ.findByPk(Number(rfq_id));
        if (!rfq) {
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "RFQ record not found!!!" });
        }
        rfq.status = "closed";
        await rfq.save({ transaction: rootTransaction });

        /** update requisition status */
        const requisition = await Requisition.findOne({ where: { requisition_no: pr_reference_code } });
        if (!requisition) {
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Requisition record not found!!!" });
        }
        requisition.status = "bpo_created";
        await requisition.save({ transaction });

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record created successfully" });

    } catch (error) {
        await rootTransaction.rollback();
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// DELETE

// PUT