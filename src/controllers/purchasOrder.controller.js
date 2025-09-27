import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const allPurchasOrderList = asyncHandler(async (req, res) => {
    const { PurchasOrder, PurchaseOrderItems, User, Product } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const purchasOrder = await PurchasOrder.findAndCountAll({
            where: id ? { id } : undefined,
            include: [
                {
                    model: User,
                    as: "POcreatedBy",
                    attributes: ["id", "email"]
                },
                {
                    model: PurchaseOrderItems,
                    as: "purchasOrderDetails",
                    // attributes: {
                    //     exclude: ["requisition_id"]
                    // },
                    include: [
                        {
                            model: Product,
                            as: "productInwarded"
                        }
                    ]
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!purchasOrder) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = purchasOrder.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: purchasOrder,
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
const createPurchasOrder = asyncHandler(async (req, res) => {
    const { PurchasOrder, PurchaseOrderItems, Product, Requisition } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { pr_id = "", status = "", priority = "", expected_delivery_date = "", note = "", items = [] } = req.body;
        const userDetails = req.user;
        if (!pr_id) return res.status(400).json({ success: false, code: 400, message: "Requisition id must required!!!" });

        const requisition = await Requisition.findByPk(pr_id);
        if (!requisition) return res.status(404).json({ success: false, code: 404, message: "Requisition not found!!!" });

        const purchasOrder = await PurchasOrder.create({
            pr_id,
            status: status.toLowerCase(),
            priority: priority.toLowerCase(),
            expected_delivery_date,
            note,
            created_by: userDetails.id,
        },
            { transaction });

        const total = items.reduce((accumulator, item) => accumulator + parseInt(item.line_total), 0);

        for (const item of items) {
            const product = await Product.findOne({
                where: {
                    barcode: parseInt(item.barcode)
                },
                transaction
            });
            if (!product) {
                if (transaction) await transaction.rollback();
                return res.status(200).json({ success: true, code: 200, message: `Product with barcode: ${item.barcode} not found` });
            }

            await PurchaseOrderItems.create({
                po_id: purchasOrder.id,
                product_id: product.id,
                quantity_ordered: parseInt(quantity_ordered, 10),
                ...item,
            },
                { transaction });
        }

        await PurchasOrder.update(
            { total },
            { where: { id: purchasOrder.id }, transaction }
        );

        await transaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Purchase Order Created." });
    } catch (error) {
        if (transaction) await transaction.rollback();
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

        const purchasOrder = await PurchasOrder.findByPk(id);
        if (!purchasOrder) return res.status(404).json({ success: false, code: 404, message: "Purchase Order not found!!!" });

        // const currentStatus = requisition.status;
        // if (["draft", "submitted"].some(item => item === currentStatus)) {

            let updateDetails = {};
            if (status) updateDetails.status = status.toLowerCase();
            if (priority) updateDetails.priority = priority.toLowerCase();
            if (expected_delivery_date) updateDetails.expected_delivery_date = expected_delivery_date;
            if (note) updateDetails.note = note;

            const isUpdate = await PurchasOrder.update(
                updateDetails,
                { where: { id } }
            );
            if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

            return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });
        // };
        // return res.status(400).json({ success: false, code: 400, message: "Updation not possible!!!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updatePurchasOrderItem = asyncHandler(async (req, res) => {
    const { PurchaseOrderItems } = req.dbModels;
    try {
        const { id = "", quantity_ordered = "", unit_price = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });
        
        const purchaseOrderItems = await PurchaseOrderItems.findByPk(id);
        if (!purchaseOrderItems) return res.status(404).json({ success: false, code: 404, message: "Item Not found!!!" });

        let updateDetails = {};
        if (note) updateDetails.note = note;
        
        if (quantity_ordered && unit_price) {
            updateDetails.line_total = quantity_ordered * unit_price;
            updateDetails.quantity_ordered = quantity_ordered;
            
        } else if (unit_price) {
            updateDetails.line_total = purchaseOrderItems.quantity_ordered * unit_price;
            updateDetails.unit_price = unit_price;
            
        } else if (quantity_ordered) {
            updateDetails.line_total = quantity_ordered * purchaseOrderItems.unit_price;
            updateDetails.quantity_ordered = quantity_ordered;
        }

        const isUpdate = await PurchaseOrderItems.update(
            updateDetails,
            { where: { id } }
        );
        if(!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });        

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allPurchasOrderList, createPurchasOrder, deletePurchasOrder, updatePurchasOrder, updatePurchasOrderItem };