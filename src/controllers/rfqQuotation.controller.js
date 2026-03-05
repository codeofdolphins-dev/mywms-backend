import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rootDB } from "../db/tenantMenager.service.js"


// GET
export const allRfqQuotationList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem } = models;

    const dbName = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 10, id = "", rfq_no = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        let rfq_id = null;
        if (rfq_no) {
            const rfq = await RFQ.findOne({ where: { rfq_no } });
            rfq_id = rfq.id;
        }

        const rfqQuotation = await RfqQuotation.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(rfq_no && { rfq_id }),
                vendor_tenant: dbName
            },
            include: [
                {
                    model: RFQ,
                    as: "linkedRfq",
                    attributes: ["rfq_no"]
                },
                {
                    model: RfqQuotationItem,
                    as: "quotationItems",
                    attributes: {
                        exclude: ["quotation_id", "qty"]
                    },
                    include: [
                        {
                            model: RFQItem,
                            as: "sourceRfqItem"
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


// POST
export const createRfqQuotation = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();

    const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const dbName = req.headers["x-tenant-id"];

    try {
        const { rfq_no = "", valid_till = "", grandTotal = "", buyer_name = "", items = "" } = req.body;
        if (!rfq_no || items?.length < 1) throw new Error("Required fields are missing!!!");

        const rfq = await RFQ.findOne({ where: { rfq_no } });
        if (!rfq) throw new Error("RFQ record not found!!!");

        const isExists = await RfqQuotation.findOne({
            where: {
                rfq_id: rfq.id,
                vendor_tenant: dbName
            }
        });
        if (isExists) throw new Error("Record already created!!!");

        const rfqQuotation = await RfqQuotation.create({
            rfq_id: rfq.id,
            vendor_tenant: dbName,
            buyer_name: buyer_name?.trim(),
            ...(valid_till && { valid_till: new Date(valid_till) }),
            grand_total: Number(grandTotal),
        }, { transaction: rootTransaction });


        for (const item of items) {
            const { id = "", offer_price = "", qty = "", line_total = "" } = item;
            if (!id || !offer_price) throw new Error("Required fields are missing in items array!!!");

            const rfqItem = await RFQItem.findByPk(Number(id));
            if (!rfqItem) throw new Error("RFQ items record not found!!!");

            await RfqQuotationItem.create({
                quotation_id: rfqQuotation.id,
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


const updateRequisition = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();

    const { RFQ, RFQItem, RfqQuotation, RfqQuotationItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const dbName = req.headers["x-tenant-id"];

    try {
        const { id = "", valid_till = "", grandTotal = "", buyer_name = "", items = "" } = req.body;

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