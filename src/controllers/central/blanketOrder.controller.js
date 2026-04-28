import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { rootDB } from "../../db/tenantMenager.service.js";
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

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: (id || bpo_no || noLimit) ? blanketOrder?.rows?.[0] : blanketOrder?.rows,
            ...(!(id || bpo_no || noLimit) && {
                meta: {
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

// GET
export const blanketOrderWithProductDetails = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem } = models;
    const { Product } = req.dbModels;

    try {
        const { bpo_no } = req.params;
        if (!bpo_no) throw new Error("bpo_no is required");

        const blanketOrders = await BlanketOrder.findOne({
            where: { bpo_no: bpo_no.trim() },
            include: [
                {
                    model: BlanketOrderItem,
                    as: "blanketOrderItems",
                }
            ],
        });
        if (!blanketOrders || blanketOrders.length === 0) return res.status(404).json({ success: false, code: 404, message: "Blanket Order not found" });

        const productIds = blanketOrders?.blanketOrderItems?.flatMap(item => item.buyer_product_id);

        if (productIds.length === 0) {
            return res.status(200).json({
                success: true,
                code: 200,
                message: "Fetched Successfully.",
                data: blanketOrders,
            });
        }

        const products = await Product.findAll({
            where: { id: { [Op.in]: [...new Set(productIds)] } },
            attributes: ["id", "name", "sku", "unit_type", "photo"]
        });

        const productMap = new Map(products.map(p => [p.id, p.toJSON()]));

        const orderJson = blanketOrders.toJSON();
        orderJson.blanketOrderItems = orderJson.blanketOrderItems.map(item => ({ ...item, product: productMap.get(item.buyer_product_id) || null }));

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: orderJson,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



// POST
export const createBlanketOrder = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    // console.log(req.body); return

    const { BlanketOrder, BlanketOrderItem, RfqQuotationRevision, RfqQuotation, ProductMapping } = models;
    const rootTransaction = await rootSequelize.transaction();

    const { Requisition } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { rfq_quotation_revision_id = "", buyer_tenant = "", vendor_tenant = "", valid_until = "", items = "", pr_reference_code = "" } = req.body;
        if ([rfq_quotation_revision_id, buyer_tenant, vendor_tenant, items, pr_reference_code].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const revision = await RfqQuotationRevision.findByPk(Number(rfq_quotation_revision_id));
        if (!revision) {
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        };

        /** check RFQ Quotation */
        const quotation = await RfqQuotation.findByPk(revision.quotation_id);
        if (!quotation) {
            await rootTransaction.rollback();
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
const deleteBlanketOrder = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RfqQuotation } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        const { id } = req.params;
        if (!id) throw new Error("Id is required!!!");

        const quotation = await RfqQuotation.findOne({ where: { id: parseInt(id, 10), vendor_tenant: dbName } });
        if (!quotation) return res.status(404).json({ success: false, code: 404, message: "No record found!!!" });

        const isDeleted = await RfqQuotation.destroy({
            where: { id: parseInt(id, 10) },
        });
        if (!isDeleted) return res.status(503).json({ success: false, code: 503, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// PUT
const updateBlanketOrder = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();

    const { RFQItem, RfqQuotation, RfqQuotationRevision, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    try {
        const { quotation_id = "", grandTotal = "", items = "" } = req.body;
        if (!quotation_id || items?.length < 1) throw new Error("Required fields are missing!!!");

        const quotation = await RfqQuotation.findByPk(Number(quotation_id));
        if (!quotation) {
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Quotation record not found!!!" });
        }

        const current_revision_no = quotation.current_revision_no;
        if (current_revision_no >= 3) {
            await rootTransaction.rollback();
            return res.status(405).json({ success: false, code: 405, message: "Cannot update this quotation!!!" });
        };

        quotation.current_revision_no = current_revision_no + 1;
        await quotation.save({ transaction: rootTransaction });

        const revision = await RfqQuotationRevision.create({
            quotation_id: quotation.id,
            grand_total: Number(grandTotal),
            revision_no: current_revision_no + 1,
        }, { transaction: rootTransaction });


        for (const item of items) {
            const { rfq_item_id = "", offer_price = "", qty = "" } = item;
            if (!rfq_item_id || !offer_price) throw new Error("Required fields are missing in items array!!!");

            const rfqItem = await RFQItem.findByPk(Number(rfq_item_id));
            if (!rfqItem) throw new Error("RFQ items record not found!!!");

            await RfqQuotationItem.create({
                revision_id: revision.id,
                rfq_item_id: rfqItem.id,
                qty,
                offer_price,
            }, { transaction: rootTransaction });
        };

        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record created successfully" });

    } catch (error) {
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});