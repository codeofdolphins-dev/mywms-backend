import { asyncHandler } from "../utils/asyncHandler.js";


// GET
const allQuotation = asyncHandler(async (req, res) => {
    const { Quotation, QuotationItem, BusinessNode, NodeDetails } = req.dbModels;
    const current_node = req.user?.userBusinessNode[0];

    try {
        let { page = 1, limit = 10, id = "", quotation_no = "", sortBy = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const quotation = await Quotation.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(quotation_no && { quotation_no: quotation_no }),
                ...(sortBy && { status: sortBy.toLowerCase() }),
                from_business_node_id: current_node.id
            },
            include: [
                {
                    model: QuotationItem,
                    as: "quotationItem",
                },
                {
                    model: BusinessNode,
                    as: "toBusinessNode",
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails",
                        }
                    ]
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!quotation) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = quotation.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: quotation.rows,
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


/** GET all receive requisition list  */
const allReceiveRequisitionList = asyncHandler(async (req, res) => {
    const {
        BusinessNode, Requisition, NodeDetails,
        RequisitionItem, User, Product,
        UnitType, PackageType, Category, Brand
    } = req.dbModels;

    const current_node = req.user?.userBusinessNode[0];

    try {
        let {
            page = 1, limit = 10, id = "", requisition_no = "", title = "", sortBy = ""
        } = req.query;

        limit = Number(limit);
        const offset = (Number(page) - 1) * limit;

        const { count, rows } = await Requisition.findAndCountAll({
            distinct: true,
            subQuery: false,
            include: [
                {
                    model: BusinessNode,
                    as: "supplierBusinessNode",
                    required: true,
                    where: {
                        id: current_node.id,
                    },
                    through: { attributes: [] },
                },
            ],

            where: {
                ...(id && { id: Number(id) }),
                ...(requisition_no && { requisition_no }),
                ...(title && { title }),
                ...(sortBy && {
                    [Op.or]: [
                        { priority: sortBy.toLowerCase() },
                        { status: sortBy.toLowerCase() },
                    ],
                }),
            },

            limit,
            offset,
            order: [["createdAt", "DESC"]],
        });

        // No data guard
        if (!rows.length) {
            return res.status(200).json({
                success: true,
                code: 200,
                message: "Fetched Successfully.",
                data: [],
                meta: {
                    total: 0,
                    page,
                    pageSize: limit,
                    totalPages: 0,
                },
            });
        }

        const requisitionIds = rows.map(r => r.id);

        // STEP 2: Load full requisition graph
        const requisitions = await Requisition.findAll({
            where: {
                id: requisitionIds,
            },
            include: [
                {
                    model: BusinessNode,
                    as: "buyer",
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails",
                        }
                    ]
                },
                {
                    model: User,
                    as: "createdBy",
                    attributes: ["name", "email", "company_name", "phone_no", "profile_image"]
                },
                {
                    model: RequisitionItem,
                    as: "items",
                    required: false,
                    include: [
                        {
                            model: Product,
                            as: "product",
                            include: [
                                { model: UnitType, as: "unitRef" },
                                { model: PackageType, as: "packageType" },
                            ],
                        },
                        { model: Brand, as: "brand" },
                        { model: Category, as: "category" },
                        { model: Category, as: "subCategory" },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });


        if (!requisitions)
            return res.status(500).json({
                success: false,
                code: 500,
                message: "Fetched failed!!!",
            });

        const totalItems = count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: requisitions,
            meta: {
                totalItems,
                currentPage: page,
                totalPages,
                limit,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const createQuotation = asyncHandler(async (req, res) => {
    const { Quotation, QuotationItem, Requisition, RequisitionItem, RequisitionSupplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { reqNo = "", validTill = "", note = "", grandTotal = "", items = [] } = req.body;
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'long' });

        if (!reqNo) throw new Error("Requisition No missing!!!");
        if (items.length == 0) throw new Error("Empty items not allow!!!");

        const userDetails = req.user;
        const current_node = userDetails?.userBusinessNode[0];


        const requisition = await Requisition.findOne({ where: { requisition_no: reqNo } });
        if (!requisition) throw new Error("No Requisition found!!!");

        const existingQuotation = await Quotation.findOne({
            where: {
                requisition_id: requisition.id,
                from_business_node_id: current_node.id
            }
        });
        if (existingQuotation) {
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: "Quotation Already created!!!" });
        };

        const requisitionSupplier = await RequisitionSupplier.findOne({
            where: {
                requisition_id: requisition.id,
                supplier_business_node_id: current_node.id
            }
        });
        console.log(requisitionSupplier);
        if (!requisitionSupplier) throw new Error("This requisition is not assigned to your location");

        const quotation = await Quotation.create({
            requisition_id: requisition.id,
            from_business_node_id: current_node.id,
            to_business_node_id: requisition.buyer_business_node_id,
            valid_till: new Date(validTill),
            created_by: userDetails.id,
            grandTotal,
            note
        }, { transaction });

        const quotation_no = `QT-${year}-${monthName}-${quotation.id}`;

        await quotation.update({ quotation_no }, { transaction });

        for (const item of items) {
            const requisitionItem = await RequisitionItem.findOne({
                where: {
                    id: Number(item.id),
                    requisition_id: requisition.id
                }
            });
            if (!requisitionItem) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Requisition Item not found!!!" });
            }

            await QuotationItem.create({
                quotation_id: quotation.id,
                requisition_item_id: requisitionItem.id,
                offer_price: item.offerPrice,
                total_price: item.total,
                ...(item.note && { note: item.note })
            }, { transaction });
        }

        await requisitionSupplier.update({ status: "quoted" }, { transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Quotation created." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateQuotationDetails = asyncHandler(async (req, res) => {
    const { Quotation } = req.dbModels;
    try {
        const { id = "", status = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Quotation id must required!!!" });

        const quotation = await Quotation.findByPk(id);
        if (!quotation) return res.status(404).json({ success: false, code: 404, message: "Quotation not found!!!" });

        let updateDetails = {};
        if (status) updateDetails.status = status.toLowerCase();
        if (note) updateDetails.note = note;

        const isUpdated = await Quotation.update(
            updateDetails,
            { where: { id } }
        );
        if (!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Quotation details updated." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateQuotationItems = asyncHandler(async (req, res) => {
    const { Quotation, QuotationItems } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id = "", quantity = "", unit_price = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const quotationItem = await QuotationItems.findByPk(id);
        if (!quotationItem) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Quotation Item not found!!!" });
        }

        const quotation = await Quotation.findByPk(quotationItem.quotation_id);

        let newQty = quantity || quotationItem.quantity;
        let newUnit_price = unit_price || quotationItem.unit_price;
        let updateDetails = {
            quantity: newQty,
            unit_price: newUnit_price,
            total_price: newQty * newUnit_price,
            ...(note && { note })
        };
        const total = quotation.total - quotationItem.total_price + updateDetails.total_price;

        await QuotationItems.update(
            updateDetails,
            { where: { id }, transaction }
        );

        const isUpdated = await Quotation.update(
            { total },
            { where: { id: quotation.id }, transaction }
        );
        if (!isUpdated) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Quotation details updated." });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteQuotation = asyncHandler(async (req, res) => {
    const { Quotation } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await Quotation.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allQuotation, allReceiveRequisitionList, createQuotation, updateQuotationItems, updateQuotationDetails, deleteQuotation };