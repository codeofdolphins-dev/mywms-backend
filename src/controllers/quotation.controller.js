import { asyncHandler } from "../utils/asyncHandler.js";


// GET
const allQuotation = asyncHandler(async (req, res) => {
    const { Quotation, QuotationItems, Requisition, Vendor, Product } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const quotation = await Quotation.findAndCountAll({
            where: id ? { id } : undefined,
            include: [
                {
                    model: Requisition,
                    as: "quotationRequisition"
                },
                {
                    model: Vendor,
                    as: "vendor"
                },
                {
                    model: QuotationItems,
                    as: "quotationItem",
                    include: [
                        {
                            model: Product,
                            as: "quotedProduct"
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

// POST
const create = asyncHandler(async (req, res) => {
    const { Quotation, QuotationItems, Requisition, Vendor, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { pr_id = "", vendor_id = "", status = "", note = "", items = [] } = req.body;
        if (!pr_id || !vendor_id) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });
        if (items.length == 0) return res.status(400).json({ success: false, code: 400, message: "Empty items not allow!!!" });

        const requisition = await Requisition.findByPk(pr_id);
        if (!requisition) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "No Requisition found!!!" });
        }

        const vendor = await Vendor.findByPk(vendor_id);
        if (!vendor) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "No Vendor found!!!" });
        }

        const quotation = await Quotation.create({
            pr_id: parseInt(pr_id),
            vendor_id: parseInt(vendor_id),
            status: status === "" ? undefined : status.toLowerCase(),
            note
        }, { transaction });

        let total = 0;

        for (const item of items) {
            const product = await Product.findOne({ where: { barcode: parseInt(item.barcode) }, transaction });
            if (!product) {
                if (transaction) await transaction.rollback();
                return res.status(200).json({ success: true, code: 200, message: `Product with barcode: ${item.barcode} not found` });
            }

            const total_price = parseInt(item.quantity, 10) * parseInt(item.unit_price, 10);
            total += total_price;

            await QuotationItems.create({
                quotation_id: quotation.id,
                product_id: product.id,
                total_price,
                ...item
            }, { transaction });
        }

        await Quotation.update(
            { total },
            { where: { id: quotation.id }, transaction }
        );

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Quotation created." });

    } catch (error) {
        if (transaction) await transaction.rollback();
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
        if (!quotationItem){
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
        if (!isUpdated){
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

export { allQuotation, create, updateQuotationItems, updateQuotationDetails, deleteQuotation };