import { asyncHandler } from "../utils/asyncHandler.js";


// GET
const allQuotation = asyncHandler(async (req, res) => {
    const { Quotation, QuotationItem, BusinessNode, NodeDetails, RequisitionItem, Product, UnitType, PackageType } = req.dbModels;
    const current_node = req.activeNode;

    try {
        let { page = 1, limit = 10, id = "", quotation_no = "", sortBy = "", requisitionId = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const quotation = await Quotation.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(quotation_no && { quotation_no: quotation_no }),
                ...(sortBy && { status: sortBy.toLowerCase() }),
                ...(requisitionId && { requisition_id: Number(requisitionId) }),
                from_business_node_id: current_node
            },
            include: [
                {
                    model: QuotationItem,
                    as: "quotationItem",
                    include: [
                        {
                            model: RequisitionItem,
                            as: "sourceRequisitionItem",
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
                            ],
                        }
                    ]
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
                }
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


/** GET all receive quotation list based on no */
const allReceiveQuotationList = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, NodeDetails, BusinessNode, Quotation, QuotationItem, Product, PurchasOrder } = req.dbModels;

    try {
        let { page = 1, limit = 10, reqNo = "", quotationId = "", } = req.query;
        if (!reqNo) throw new Error("Requisition no missing!!!");

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

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

        const { count, rows: quotations } = await Quotation.findAndCountAll({
            where: {
                requisition_id: requisition.id,
            },
            include: [
                {
                    model: QuotationItem,
                    as: "quotationItem",
                    separate: true,
                    ...(quotationId && { where: { quotation_id: Number(quotationId) } }),
                    attributes: {
                        exclude: ["quotation_id", "createdAt", "updatedAt"]
                    },
                    limit,
                    offset,
                    order: [["createdAt", "ASC"]],
                    include: [
                        {
                            model: RequisitionItem,
                            as: "sourceRequisitionItem",
                            attributes: {
                                exclude: ["requisition_id", "createdAt", "updatedAt"]
                            },
                            include: [
                                {
                                    model: Product,
                                    as: "product",
                                    attributes: ["name", "barcode"]

                                },
                            ]
                        },
                    ],
                },
                {
                    model: PurchasOrder,
                    as: "linkedPurchaseOrders",
                    attributes: ["po_no"]
                }
            ],
        });

        const supplierMap = {};
        requisition.supplierBusinessNode.forEach((supplier) => {
            supplier = supplier.toJSON();
            const status = supplier.RequisitionSupplier.status;
            delete supplier.RequisitionSupplier;

            supplierMap[supplier.id] = {
                ...supplier,
                status,
                quotation: null,
            };
        });


        /** define pagination calculation */
        const totalItems = await QuotationItem.count({
            where: {
                ...(quotationId && { quotation_id: Number(quotationId) })
            },
            include: [
                {
                    model: Quotation,
                    as: "quotationDetails",
                    where: {
                        requisition_id: requisition.id
                    }
                }
            ]
        });
        const totalPages = Math.ceil(totalItems / limit);


        quotations.forEach((quotation) => {
            const supplierId = quotation.from_business_node_id;

            if (!supplierMap[supplierId]) return;

            const item = quotation.quotationItem || [];

            supplierMap[supplierId].quotation = {
                id: quotation.id,
                status: quotation.status,
                valid_till: quotation.valid_till,
                revision_no: quotation.revision_no,
                grandTotal: quotation.grandTotal,
                note: quotation.note,
                createdAt: quotation.createdAt,
                purchaseOrder_no: quotation.linkedPurchaseOrders?.po_no,

                item: item ? item : null,
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            };
        });

        const refineRequisition = requisition.toJSON();
        delete refineRequisition.supplierBusinessNode;
        delete refineRequisition.items;

        const response = {
            requisition: refineRequisition,
            suppliers: Object.values(supplierMap),
        };


        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: response,
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
    // console.log(req.body); return
    try {
        const { reqNo = "", validTill = "", note = "", grandTotal = "", items = [] } = req.body;
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'short' });

        if (!reqNo) throw new Error("Requisition no required!!!");
        if (items.length == 0) throw new Error("Empty items not allow!!!");

        const userDetails = req.user;
        const current_node = req.activeNode;


        const requisition = await Requisition.findOne({ where: { requisition_no: reqNo } });
        if (!requisition) throw new Error("Requisition not found!!!");

        const existingQuotation = await Quotation.findOne({
            where: {
                requisition_id: requisition.id,
                from_business_node_id: current_node
            }
        });
        if (existingQuotation) {
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: "Quotation Already created!!!" });
        };

        const requisitionSupplier = await RequisitionSupplier.findOne({
            where: {
                requisition_id: requisition.id,
                supplier_business_node_id: current_node
            }
        });
        if (!requisitionSupplier) throw new Error("This requisition is not assigned to your location");

        const quotation = await Quotation.create({
            requisition_id: requisition.id,
            from_business_node_id: current_node,
            to_business_node_id: requisition.buyer_business_node_id,
            ...(validTill && { valid_till: new Date(validTill) }),
            created_by: userDetails.id,
            grandTotal,
            note
        }, { transaction });

        const quotation_no = `QT-${year}-${monthName}-${Date.now()}-${quotation.id}`;

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
                offer_price: Number(item.offerPrice),
                total_price: Number(item.total),
                tax_percent: Number(item.tax),
                ...(item.note && { note: item.note })
            }, { transaction });
        }

        await requisitionSupplier.update({ status: "quoted" }, { transaction });
        await requisition.update({ status: "quoted" }, { transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Quotation created." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const rejectQuotation = asyncHandler(async (req, res) => {
    const { Quotation, RequisitionSupplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id } = req.params;

        const quotation = await Quotation.findByPk(Number(id));
        if (!quotation) throw new Error("Quotation Record Not Found!!!");

        const requisitionSupplier = await RequisitionSupplier.findOne({
            where: {
                requisition_id: quotation.requisition_id,
                supplier_business_node_id: quotation.from_business_node_id
            }
        });
        if (!requisitionSupplier) throw new Error("Record Not Found!!!");

        await quotation.update({ status: "rejected" }, { transaction });
        await requisitionSupplier.update({ status: "rejected" }, { transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Quotation Rejected" });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



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

export { allQuotation, allReceiveQuotationList, createQuotation, updateQuotationItems, updateQuotationDetails, deleteQuotation, rejectQuotation };