import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { rootDB } from "../../db/tenantMenager.service.js"
import { fetchNodeDetails } from "../../helper/helper.js";


// GET
export const allRfqQuotationList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem, RfqQuotation, RfqQuotationRevision, RfqQuotationItem } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", rfq_no = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let rfq_id = null;
        if (rfq_no) {
            const rfq = await RFQ.findOne({
                where: { rfq_no }
            });
            rfq_id = rfq.id;
        }

        const rfqQuotation = await RfqQuotation.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(rfq_no && { rfq_id }),
                vendor_tenant: dbName,
            },
            include: [
                {
                    model: RFQ,
                    as: "linkedRfq",
                    // attributes: ["rfq_no"]
                },
                {
                    model: RfqQuotationRevision,
                    as: "quotationRevision",
                    include: [
                        {
                            model: RfqQuotationItem,
                            as: "revisionItems",
                            attributes: {
                                exclude: ["quotation_id", "qty"]
                            },
                            include: [
                                {
                                    model: RFQItem,
                                    as: "sourceRfqItem"
                                }
                            ]
                        }
                    ]
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });
        if (!rfqQuotation) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = rfqQuotation.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: (!rfq_no || !id) ? rfqQuotation?.rows : rfqQuotation?.rows?.[0],
            ...((!rfq_no || !id) && {
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

export const getQuotationWithPaginatedItems = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RfqQuotation, RfqQuotationRevision, RfqQuotationItem, RFQItem, TenantsName, Tenant } = models;

    try {
        const { page = 1, limit = 10, reqNo, targetVendor, targetRevision, } = req.query;

        // 1. Get the RFQ Header
        const rfq = await RFQ.findOne({ where: { pr_reference_code: reqNo } });
        if (!rfq) return res.status(404).json({ success: false, code: 404, message: "RFQ not found" });

        // 2. Get all Vendor Headers for this RFQ
        const vendorHeaders = await RfqQuotation.findAll({
            where: { rfq_id: rfq.id },
            include: [
                {
                    model: TenantsName,
                    as: "vendorTenant",
                    attributes: ["id"],
                    include: [
                        {
                            model: Tenant,
                            as: "tenantDetails",
                            attributes: ["companyName"]
                        }
                    ]
                },
            ] // include company names, etc.
        });

        // 3. Process each vendor's revision and items
        const data = await Promise.all(vendorHeaders.map(async (header) => {
            const isTarget = targetVendor && String(header.vendor_tenant) === String(targetVendor);

            // Determine which revision to show: 
            // If it's the target vendor, use targetRevision. Otherwise, use their latest (current_revision_no).
            const revToFetch = isTarget && targetRevision ? targetRevision : header.current_revision_no;

            // Fetch the specific Revision record
            const revisionRecord = await RfqQuotationRevision.findOne({
                where: {
                    quotation_id: header.id,
                    revision_no: revToFetch
                }
            });

            if (!revisionRecord) return { ...header.toJSON(), revision: null, items: [] };

            // Fetch Items for this specific revision with CONDITIONAL pagination
            const items = await RfqQuotationItem.findAndCountAll({
                where: { revision_id: revisionRecord.id },
                include: [{ model: RFQItem, as: "sourceRfqItem", attributes: { exclude: ["qty"] } },],
                limit: isTarget ? parseInt(limit) : undefined,
                offset: isTarget ? (parseInt(page) - 1) * parseInt(limit) : undefined,
                order: [['createdAt', 'ASC']]
            });

            return {
                ...header.toJSON(),
                activeRevision: revisionRecord,
                requisition: rfq,
                quotationItems: items.rows,
                pagination: {
                    totalItems: items.count,
                    currentPage: isTarget ? parseInt(page) : 1,
                    totalPages: isTarget ? Math.ceil(items.count / limit) : 1,
                    isPaginated: isTarget
                }
            };
        }));

        return res.status(200).json({ success: true, code: 200, data: data });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message });
    }
});

export const negotiateRfqQuotation = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RfqQuotation, RfqQuotationRevision } = models;

    try {
        const { id } = req.body;
        if (!id) throw new Error("quotation id must required!!!");

        const quotation = await RfqQuotation.findByPk(Number(id));
        if (!quotation) {
            return res.status(404).json({ success: false, code: 404, message: 'Quotation record not found!!!' });
        }

        const current_revision_no = quotation.current_revision_no;
        if (current_revision_no == 3) {
            return res.status(405).json({ success: false, code: 405, message: 'Cannot negotiate this quotation!!!' });
        }

        const quotationRevision = await RfqQuotationRevision.findOne({
            where: { quotation_id: Number(id) }
        });
        if (!quotationRevision) {
            return res.status(404).json({ success: false, code: 404, message: 'Record not found!!!' });
        }

        quotationRevision.status = "negotiate";
        await quotationRevision.save();

        return res.status(200).json({ success: true, code: 200, message: 'Negotiation started successfully!!!' });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message });
    }
});


// POST
export const createRfqQuotation = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();

    const { RFQ, RFQItem, RfqQuotation, RfqQuotationRevision, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const dbName = req.headers["x-tenant-id"];
    const current_node = req.activeNode;

    try {
        const { rfq_no = "", valid_till = "", grandTotal = "", buyer_name = "", items = "" } = req.body;
        if (!rfq_no || items?.length < 1) throw new Error("Required fields are missing!!!");

        const rfq = await RFQ.findOne({ where: { rfq_no } });
        if (!rfq) throw new Error("RFQ record not found!!!");


        //  check record already exists or not
        const isExists = await RfqQuotation.findOne({
            where: {
                rfq_id: rfq.id,
                vendor_tenant: dbName
            }
        });
        if (isExists) {
            await rootTransaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: "Record already created!!!" });
        }

        const nodeDetails = await fetchNodeDetails(req.dbModels, current_node);

        const rfqQuotation = await RfqQuotation.create({
            rfq_id: rfq.id,
            vendor_tenant: dbName,
            buyer_name: buyer_name?.trim() ?? "",
            ...(valid_till && { valid_till: new Date(valid_till) }),
            meta: nodeDetails,
        }, { transaction: rootTransaction });

        const revision = await RfqQuotationRevision.create({
            quotation_id: rfqQuotation.id,
            grand_total: Number(grandTotal),
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


// DELETE
export const deleteRfqQuotation = asyncHandler(async (req, res) => {
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
export const updateRfqQuotation = asyncHandler(async (req, res) => {
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