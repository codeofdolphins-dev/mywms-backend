import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const allRequisitionList = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, User, Product } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const requisition = await Requisition.findAndCountAll({
            where: id ? { id } : undefined,
            include: [
                {
                    model: User,
                    as: "createdBy",
                    attributes: ["id", "email"]
                },
                {
                    model: RequisitionItem,
                    as: "items",
                    attributes: {
                        exclude: ["requisition_id"]
                    },
                    include: [
                        {
                            model: Product,
                            as: "product"
                        }
                    ]
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!requisition) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = requisition.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: requisition,
            meta: {
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

// POST
const createRequisition = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { title = "", status = "", priority = "", required_by = "", notes = "", items = [] } = req.body;
        const userDetails = req.user;

        if (!title || !required_by){
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        const requisition = await Requisition.create({
            title,
            status: status.toLowerCase(),
            priority: priority.toLowerCase(),
            required_by,
            notes,
            created_by: userDetails.id,
        },
        { transaction });

        const total = items.reduce((accumulator, item) => accumulator + parseInt(item.unit_price_estimate), 0);

        for (const item of items) {
            const product = await Product.findOne({ where: { barcode: parseInt(item.barcode) } });
            if (!product) {
                await transaction.rollback();
                return res.status(200).json({ success: true, code: 200, message: `Product with barcode: ${item.barcode} not found` });
            }

            await RequisitionItem.create({
                requisition_id: requisition.id,
                product_id: product.id,
                ...item,
            },
            { transaction });
        }

        await Requisition.update(
            { total },
            { where: { id: requisition.id }, transaction }
        );

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Requisition Created." });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteRequisition = asyncHandler(async (req, res) => {
    const { Requisition } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await Requisition.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateRequisition = asyncHandler(async (req, res) => {
    const { Requisition } = req.dbModels;
    try {
        const { id = "", title = "", status = "", priority = "", required_by = "", notes = "" } = req.body;

        const requisition = await Requisition.findByPk(id);
        if (!requisition) return res.status(400).json({ success: false, code: 400, message: "No requisition found!!!" });

        const currentStatus = requisition.status;

        if (["draft", "submitted"].some(item => item === currentStatus)) {

            let updateDetails = {};
            if (title) updateDetails.title = title;
            if (status) updateDetails.status = status;
            if (priority) updateDetails.priority = priority;
            if (notes) updateDetails.notes = notes;
            if (required_by) updateDetails.required_by = required_by;

            const isUpdate = await Requisition.update(
                updateDetails,
                { where: { id } }
            );
            if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

            return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });
        };
        return res.status(400).json({ success: false, code: 400, message: "Updation not possible!!!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateRequisitionItems = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id = "", description = "", quantity = "", uom = "", unit_price_estimate = "" } = req.body;
        if (!id){
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });
        }

        let updateDetails = {};
        if (description) updateDetails.description = description;
        if (quantity) updateDetails.quantity = quantity;
        if (uom) updateDetails.uom = uom;
        if (unit_price_estimate) updateDetails.unit_price_estimate = unit_price_estimate;

        const requisitionItem = await RequisitionItem.findOne({ where: { id }, transaction });
        if (!requisitionItem){
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Item not found!!!" });
        }

        const isUpdate = await RequisitionItem.update(
            updateDetails,
            {
                where: { id },
                transaction
            }
        );
        if (!isUpdate){
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });
        }

        if (unit_price_estimate) {
            const requisition = await Requisition.findByPk(requisitionItem.requisition_id, { transaction });

            const total = parseInt(requisition.total) - parseInt(requisitionItem.unit_price_estimate) + parseInt(unit_price_estimate);

            await Requisition.update(
                { total },
                { where: { id: requisition.id }, transaction }
            );
        };
        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { createRequisition, deleteRequisition, allRequisitionList, updateRequisition, updateRequisitionItems };