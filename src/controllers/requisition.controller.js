import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllowedBusinessNodes } from "../services/businessNode.service.js";

// GET
const allRequisitionList = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, User, Product, UnitType, PackageType, Category, Brand } = req.dbModels;
    const current_node = req.user?.userBusinessNode[0];

    try {
        let { page = 1, limit = 10, id = "", requisition_no = "", title = "", isAdmin = false, sortBy = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const requisition = await Requisition.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(requisition_no && { requisition_no }),
                ...(title && { title }),
                ...(!isAdmin && { buyer_business_node_id: current_node.id }),
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
                        {
                            model: Brand,
                            as: "brand",
                        },
                        {
                            model: Category,
                            as: "category"
                        },
                        {
                            model: Category,
                            as: "subCategory"
                        },
                    ],
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!requisition)
            return res.status(500).json({
                success: false,
                code: 500,
                message: "Fetched failed!!!",
            });

        const totalItems = requisition.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: requisition.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, code: 500, message: error.message });
    }
});

/** GET all receive quotation list based on no */
const allReceiveQuotationList = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, NodeDetails, BusinessNode, Quotation, QuotationItem } = req.dbModels;

    try {
        let { reqNo } = req.query;
        if (!reqNo) throw new Error("Requisition no required!!!");

        const requisition = await Requisition.findOne({
            where: { requisition_no: reqNo },
            include: [
                {
                    model: BusinessNode,
                    as: "supplierBusinessNode",
                    attributes: ["id", "name", "node_type_code"],
                    through: {
                        attributes: ["status", "createdAt"],
                    },
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails",
                            attributes: ["name", "location", "image"]
                        },
                    ],
                },
                {
                    model: RequisitionItem,
                    as: "items",
                },
            ],
        });

        const quotations = await Quotation.findAll({
            where: {
                requisition_id: requisition.id,
            },
            include: [
                {
                    model: QuotationItem,
                    as: "quotationItem",
                    include: [
                        {
                            model: RequisitionItem,
                            as: "sourceRequisitionItem",
                        },
                    ],
                },
            ],
        });

        const supplierMap = {};

        requisition.supplierBusinessNode.forEach((supplier) => {
            supplierMap[supplier.id] = {
                ...supplier.toJSON(),
                quotation: null,
            };
        });


        quotations.forEach((quotation) => {
            const supplierId = quotation.from_business_node_id;

            if (!supplierMap[supplierId]) return;

            // ⚠️ alias is `quotationItem`, NOT quotationItems
            const item = quotation.quotationItem?.[0] || null;

            supplierMap[supplierId].quotation = {
                id: quotation.id,
                status: quotation.status,
                valid_till: quotation.valid_till,
                revision_no: quotation.revision_no,
                grandTotal: quotation.grandTotal,
                note: quotation.note,
                createdAt: quotation.createdAt,

                item: item ? item : null,
            };
        });


        const response = {
            requisition,
            // requisitionItems: requisition.items,

            suppliers: Object.values(supplierMap),
        };




        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: response });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const getCreateRequisitionContext = asyncHandler(async (req, res) => {
    const models = req.dbModels;

    try {
        const { userBusinessNode } = req.user;

        const allowNode = await getAllowedBusinessNodes(
            userBusinessNode?.[0]?.id,
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
        return res
            .status(500)
            .json({ success: false, code: 500, message: error.message });
    }
});

// POST
const createRequisition = asyncHandler(async (req, res) => {

    const { Requisition, RequisitionItem, Product, BusinessNode } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { title = "", supplier_node = [], required_by_date = "", priority = "", notes = "", total = "", items = [], } = req.body;
        const userDetails = req.user;
        const current_node = userDetails?.userBusinessNode[0];
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });


        if (!title || items?.length < 1 || supplier_node?.length < 1) throw new Error("Required fields are missing!!!");

        // fetch all supplier nodes
        const supplierNode = await BusinessNode.findAll({
            where: {
                id: supplier_node
            }
        });
        if (supplierNode.length != supplier_node.length) throw new Error("Some supplier records not found");
        // console.log(supplierNode); return

        const allowNodes = await getAllowedBusinessNodes(current_node?.id, req.dbModels, false);

        // check if at least one supplier node is allowed
        const isAllowed = supplierNode.some(supplier =>
            allowNodes.some(allowed => allowed.id === supplier.id)
        );
        if (!isAllowed) {
            await transaction.rollback();
            return res.status(403).json({ success: false, code: 403, message: "You are not allowed to create requisition" });
        }

        const requisition = await Requisition.create({
            buyer_business_node_id: current_node?.id,
            required_by_date,
            title,
            notes,
            grandTotal: total,
            priority: priority.toLowerCase(),
            created_by: parseInt(userDetails.id, 10),
        }, { transaction });

        const requisition_no = `REQ-${year}-${monthName}-${requisition.id}`;

        await requisition.update({
            requisition_no,
        }, { transaction });

        /** push all supplier id into join table (requisitionSupplier) */
        await requisition.addSupplierBusinessNode(
            supplierNode.map(node => node.id),
            {
                through: {
                    status: "sent",
                },
                transaction,
            }
        );

        for (const item of items) {
            if (!item.barcode || !item.brand || !item.category) throw new Error("required field are missing!!!");

            const product = await Product.findOne({
                where: { barcode: parseInt(item.barcode, 10) },
            });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: `Product with barcode: ${item.barcode} not found` });
            }

            await RequisitionItem.create(
                {
                    requisition_id: requisition.id,
                    product_id: product.id,
                    brand_id: item.brand.id,
                    category_id: item.category.id,
                    sub_category_id: item.subCategory.id,
                    qty: item.reqQty,
                    priceLimit: item.priceLimit
                },
                { transaction }
            );
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

const deleteRequisition = asyncHandler(async (req, res) => {
    const { Requisition } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await Requisition.destroy({
            where: { id: parseInt(id, 10) },
        });
        if (!isDeleted)
            return res.status(503).json({
                success: false,
                code: 503,
                message: "Deletion failed!!!",
            });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Delete Successfully.",
        });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json({ success: false, code: 500, message: error.message });
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

const updateRequisitionItems = asyncHandler(async (req, res) => {
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

export {
    createRequisition,
    deleteRequisition,
    allRequisitionList,
    updateRequisition,
    updateRequisitionItems,
    getCreateRequisitionContext,
    allReceiveQuotationList
};
