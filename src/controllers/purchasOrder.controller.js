import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const allPurchasOrderList = asyncHandler(async (req, res) => {
    const { PurchasOrder, PurchaseOrderItem, User, Product, RequisitionItem, BusinessNode, NodeDetails } = req.dbModels;
    const current_node = req.activeNode;

    try {
        let { page = 1, limit = 10, poNo = "" } = req.query;
        if (!poNo) throw new Error("PO no Missing!!!");

        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const purchasOrder = await PurchasOrder.findAll({
            where: {
                ...(poNo && { po_no: { [Op.iLike]: poNo?.trim() } }),
                // form_business_node_id: current_node
            },
            include: [
                {
                    model: User,
                    as: "POcreatedBy",
                },
                {
                    model: BusinessNode,
                    as: "poFormBusinessNode",
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails"
                        }
                    ]
                },
                {
                    model: BusinessNode,
                    as: "poToBusinessNode",
                    include: [
                        {
                            model: NodeDetails,
                            as: "nodeDetails"
                        }
                    ]
                },
                {
                    model: PurchaseOrderItem,
                    as: "purchasOrderItems",
                    separate: true,
                    include: [
                        {
                            model: RequisitionItem,
                            as: "poi_sourceRequisitionItem",
                            attributes: {
                                exclude: ["priceLimit", "qty", "remarks", "requisition_id", "createdAt", "updatedAt"]
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
                    limit,
                    offset,
                    order: [["createdAt", "ASC"]],
                },
            ],
        });
        if (!purchasOrder) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        /** define pagination calculation */
        const totalItems = await PurchaseOrderItem.count({
            include: [
                {
                    model: PurchasOrder,
                    as: "purchasOrder",
                    where: { po_no: { [Op.iLike]: poNo } }
                }
            ]
        })
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: poNo ? purchasOrder?.[0] : purchasOrder,
            ...(!poNo && {
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            })
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const createPurchasOrder = asyncHandler(async (req, res) => {
    const { Requisition, RequisitionItem, Quotation, QuotationItem, PurchasOrder, PurchaseOrderItem, RequisitionSupplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { quotationId = "" } = req.body;
        const userDetails = req.user;
        const current_node = req.activeNode;  // from business node
        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'short' });

        if (!quotationId) throw new Error("Quotation no required!!!");

        const quotation = await Quotation.findByPk(
            Number(quotationId), {
            include: [
                {
                    model: QuotationItem,
                    as: "quotationItem"
                }
            ]
        });
        if (!quotation) throw new Error("Quotation record not found!!!");

        const existingPO = await PurchasOrder.findOne({
            where: { quotation_id: quotationId }
        });
        if (existingPO) throw new Error("PO already created!!!");

        const requisitionId = quotation.requisition_id;
        const businessNodeId = quotation.from_business_node_id;     // to business node

        const requisition = await Requisition.findByPk(requisitionId, { transaction });

        await Quotation.update(
            { status: "rejected" },
            {
                where: {
                    requisition_id: requisitionId,
                    id: { [Op.ne]: quotation.id }
                },
                transaction
            }
        );
        quotation.status = "accepted";
        quotation.save({ transaction });

        await RequisitionSupplier.update(
            { status: "rejected" },
            {
                where: {
                    requisition_id: requisitionId,
                    supplier_business_node_id: { [Op.ne]: businessNodeId }
                }
            }, transaction
        );
        await RequisitionSupplier.update(
            { status: "accepted" },
            {
                where: {
                    requisition_id: requisitionId,
                    supplier_business_node_id: businessNodeId
                }
            }, transaction
        );

        // PO creation
        const purchasOrder = await PurchasOrder.create({
            po_no: "0",
            quotation_id: quotation.id,
            requisition_id: Number(requisitionId),
            form_business_node_id: Number(current_node),
            to_business_node_id: Number(businessNodeId),
            status: "released",
            po_date: new Date(),
            created_by: Number(userDetails.id),
            grand_total: quotation.grandTotal,
            note: requisition.notes,
        }, { transaction }
        );
        const po_no = `PO-${year}-${monthName}-${Date.now()}-${purchasOrder.id}`;
        await purchasOrder.update({ po_no }, { transaction });

        // PO items creation
        for (const qi of quotation.quotationItem) {
            const reqItem = await RequisitionItem.findByPk(qi.requisition_item_id, { transaction });

            await PurchaseOrderItem.create({
                purchase_order_id: purchasOrder.id,
                requisition_item_id: qi.requisition_item_id,

                qty: reqItem.qty,
                unit_price: qi.offer_price,
                tax_percent: qi.tax_percent,
                line_total: qi.total_price
            }, { transaction });
        };

        requisition.status = "po_created";
        await requisition.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Purchase Order Created." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deletePurchasOrder = asyncHandler(async (req, res) => {
    const { PurchasOrder } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await PurchasOrder.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updatePurchasOrder = asyncHandler(async (req, res) => {
    const { PurchasOrder } = req.dbModels;
    try {
        const { id = "", status = "", priority = "", expected_delivery_date = "", note = "" } = req.body;
        const userDetails = req.user;

        const purchasOrder = await PurchasOrder.findByPk(id);
        if (!purchasOrder) return res.status(404).json({ success: false, code: 404, message: "Purchase Order not found!!!" });

        // const currentStatus = requisition.status;
        // if (["draft", "submitted"].some(item => item === currentStatus))

        let updateDetails = {};
        if (status) updateDetails.status = status.toLowerCase();
        if (priority) updateDetails.priority = priority.toLowerCase();
        if (expected_delivery_date) updateDetails.expected_delivery_date = expected_delivery_date;
        if (note) updateDetails.note = note;
        updateDetails.approved_by = userDetails.id

        const isUpdate = await PurchasOrder.update(
            updateDetails,
            { where: { id } }
        );
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updatePurchasOrderItem = asyncHandler(async (req, res) => {
    const { PurchasOrder, PurchaseOrderItem } = req.dbModels;
    try {
        const { id = "", quantity_ordered = "", unit_price = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const PurchaseOrderItem = await PurchaseOrderItem.findByPk(id);
        if (!PurchaseOrderItem) return res.status(404).json({ success: false, code: 404, message: "Item Not found!!!" });

        const purchasOrder = await PurchasOrder.findByPk(PurchaseOrderItem.po_id);

        let updateDetails = {};
        if (note) updateDetails.note = note;

        if (quantity_ordered && unit_price) {
            updateDetails.line_total = quantity_ordered * unit_price;
            updateDetails.quantity_ordered = quantity_ordered;
            updateDetails.unit_price = unit_price;

        } else if (unit_price) {
            updateDetails.line_total = PurchaseOrderItem.quantity_ordered * unit_price;
            updateDetails.unit_price = unit_price;

        } else if (quantity_ordered) {
            updateDetails.line_total = quantity_ordered * PurchaseOrderItem.unit_price;
            updateDetails.quantity_ordered = quantity_ordered;
        }

        await PurchaseOrderItem.update(
            updateDetails,
            { where: { id } }
        );

        const total_amount = purchasOrder.total_amount - PurchaseOrderItem.line_total + updateDetails.line_total
        const isUpdate = await PurchasOrder.update(
            { total_amount },
            { where: { id: purchasOrder.id } }
        );
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allPurchasOrderList, createPurchasOrder, deletePurchasOrder, updatePurchasOrder, updatePurchasOrderItem };