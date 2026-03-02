import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNo } from "../helper/generate.js";
import { rootDB } from "../db/tenantMenager.service.js"


// GET
export const allRfqList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { RFQ, RFQItem } = models;

    try {
        let { page = 1, limit = 10, id = "", rfq_no = "", title = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const rfq = await RFQ.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(rfq_no && { rfq_no }),
                ...(title && { title: title?.trim() }),
            },
            include: [
                {
                    model: RFQItem,
                    as: "items",
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!rfq) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = rfq.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: rfq.rows,
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
const create = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const { RFQ, RFQItem } = models;
    const rootTransaction = await rootSequelize.transaction();

    const { Requisition, RequisitionItem, Product, RequisitionCategory } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    // console.log(req.body); return

    try {
        const { title = "", requisition_category_id = "", required_by_date = "", priority = "", notes = "", total = "", items = "", } = req.body;
        const userDetails = req.user;
        const current_node = req.activeNode;

        if (!title || items?.length < 1) throw new Error("Required fields are missing!!!");

        const rCat = await RequisitionCategory.findByPk(Number(requisition_category_id));


        const requisition = await Requisition.create({
            buyer_business_node_id: current_node,
            title,
            notes,
            grandTotal: total,
            requisition_category_id: rCat?.id,
            type: "external",
            ...(required_by_date && { required_by_date: new Date(required_by_date) }),
            created_by: parseInt(userDetails.id, 10),
            ...(priority && { priority: priority.toLowerCase() }),
        }, { transaction });

        // update requisition no field
        await requisition.update({
            requisition_no: generateNo("EX-REQ", requisition.id)
        }, { transaction });


        const rfq = await RFQ.create({
            buyer_tenant_id: current_node,
            pr_reference_id: requisition.id,
            status: "open",
            ...(required_by_date && { submission_deadline: new Date(required_by_date) }),
            grand_total: total,
        }, {
            transaction: rootTransaction
        });

        await rfq.update({ rfq_no: generateNo("RFQ", rfq.id) }, { transaction: rootTransaction });


        for (const item of items) {
            const { id = "", priceLimit = "", reqQty = "" } = item;
            if ([id, reqQty, priceLimit].some(i => i === "")) throw new Error("required fields are missing!!!");

            const product = await Product.findByPk(Number(id));
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: `Product with barcode: ${item.barcode} not found` });
            }

            // create record in requisition item model
            await RequisitionItem.create(
                {
                    requisition_id: requisition.id,
                    product_id: product.id,
                    brand: item.brand,
                    category: item.category,
                    sub_category: item.subCategory,
                    qty: item.reqQty,
                    price_limit: item.priceLimit
                },
                { transaction }
            );

            await RFQItem.create({
                rfq_id: rfq.id,
                product_name: product.name,
                qty: item.reqQty,
                uom: product.unit_type,
                price_limit: item.priceLimit
            }, { transaction: rootTransaction });

        }

        await transaction.commit();
        return res
            .status(200)
            .json({
                success: true,
                code: 200,
                message: "Requisition Created.",
            });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res
            .status(500)
            .json({ success: false, code: 500, message: error.message });
    }
});


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