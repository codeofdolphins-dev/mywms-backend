import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllowedBusinessNodes } from "../services/businessNode.service.js";

// GET
const allRequisitionList = asyncHandler(async (req, res) => {
    const {
        Requisition,
        RequisitionItem,
        User,
        Product,
        UnitType,
        PackageType,
        HSN,
        Category,
        Brand,
    } = req.dbModels;
    const current_node = req.user?.userBusinessNode[0];

    try {
        let {
            page = 1,
            limit = 10,
            id = "",
            requisition_no = "",
            title = "",
            isAdmin = false,
            sortBy = "",
        } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        // const requisition = await Requisition.findAndCountAll({
        //     where: {
        //         ...(id && { id: Number(id) }),
        //         ...(requisition_no && { requisition_no }),
        //         ...(title && { title }),
        //         ...(!isAdmin && { buyer_business_node_id: current_node.id }),
        //         ...(sortBy && {
        //             [Op.or]: [
        //                 { priority: sortBy.toLowerCase() },
        //                 { status: sortBy.toLowerCase() },
        //             ],
        //         }),
        //     },
        //     include: [
        //         {
        //             model: User,
        //             as: "createdBy",
        //             // attributes: ["id", "email"]
        //         },
        //         {
        //             model: RequisitionItem,
        //             as: "items",
        //             attributes: {
        //                 exclude: ["requisition_id"],
        //             },
        //             include: [
        //                 {
        //                     model: Product,
        //                     as: "product",
        //                     include: [
        //                         {
        //                             model: Brand,
        //                             as: "productBrands",
        //                             through: { attributes: [] },
        //                             // attributes: ["name"]
        //                         },
        //                         {
        //                             model: Category,
        //                             as: "productCategories",
        //                             through: { attributes: [] },
        //                             // attributes: ["name"]
        //                             where: {
        //                                 parent_id: null
        //                             },
        //                             include: [
        //                                 {
        //                                     model: Category,
        //                                     as: "subcategories"
        //                                 }
        //                             ]
        //                         },
        //                         {
        //                             model: UnitType,
        //                             as: "unitRef",
        //                         },
        //                         {
        //                             model: PackageType,
        //                             as: "packageType",
        //                         },
        //                         {
        //                             model: HSN,
        //                             as: "hsn",
        //                         },
        //                     ],
        //                 },
        //             ],
        //         },
        //     ],
        //     limit,
        //     offset,
        //     order: [["createdAt", "ASC"]],
        // });

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
                    required: false, // Add this
                    include: [
                        {
                            model: Product,
                            as: "product",
                            required: false, // Add this
                            include: [
                                {
                                    model: Brand,
                                    as: "productBrands",
                                    through: { attributes: [] },
                                    required: false,
                                },
                                {
                                    model: Category,
                                    as: "productCategories",
                                    through: { attributes: [] },
                                    required: false, // This is critical
                                    where: {
                                        parent_id: null
                                    },
                                    include: [
                                        {
                                            model: Category,
                                            as: "subcategories",
                                            required: false
                                        }
                                    ]
                                },
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
                                {
                                    model: HSN,
                                    as: "hsn",
                                    required: false,
                                },
                            ],
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
    // console.log(req.body); return

    const { Requisition, RequisitionItem, Product, BusinessNode } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { title = "", supplier_node = "", required_by_date = "", priority = "", notes = "", items = [], } = req.body;
        const userDetails = req.user;
        const current_node = userDetails?.userBusinessNode[0];
        const year = new Date().getFullYear();

        if (!title || items.length < 1) throw new Error("Required fields are missing!!!");

        // fetch all supplier nodes
        const supplierNode = await BusinessNode.findByPk(supplier_node);
        if (!supplierNode) throw new Error("supplier record not found");

        const allowNodes = await getAllowedBusinessNodes(current_node?.id, req.dbModels, false);

        const isAllowed = allowNodes.some(node => node.id == supplierNode.id);

        if (!isAllowed) {
            await transaction.rollback();
            return res.status(403).json({ success: false, code: 403, message: "You are not allowed to create requisition" });
        }

        const requisition = await Requisition.create({
            buyer_business_node_id: current_node?.id,
            required_by_date,
            title,
            notes,
            priority: priority.toLowerCase(),
            created_by: parseInt(userDetails.id, 10),
        }, { transaction });

        const requisition_no = `REQ-${year}-${requisition.id}`;

        await requisition.update({
            requisition_no,
        }, { transaction });

        /** push all supplier id into join table (requisitionSupplier) */
        await requisition.addSupplierBusinessNode(
            supplierNode.id,
            {
                through: {
                    status: "sent",
                },
                transaction,
            }
        );

        for (const item of items) {
            if (!item.barcode) throw new Error("barcode required!!!");

            const product = await Product.findOne({
                where: { barcode: parseInt(item.barcode, 10) },
            });
            if (!product) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    code: 404,
                    message: `Product with barcode: ${item.barcode} not found`,
                });
            }

            await RequisitionItem.create(
                {
                    requisition_id: requisition.id,
                    product_id: product.id,
                    qty: item.reqQty,
                },
                { transaction },
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
};
