import { asyncHandler } from "../utils/asyncHandler.js";


// GET
const allQuotation = asyncHandler(async (req, res) => {
    const { VendorQuotation, VendorQuotationItems, Requisition, Vendor } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        let { page = 1, limit = 10, id = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const requisition = await VendorQuotation.findAndCountAll({
            where: id ? { id } : undefined,
            include: [
                {
                    model: Requisition,
                    as: "quotationRequisition",
                    // attributes: ["id", "email"]
                },
                {
                    model: Vendor,
                    as: "vendor",
                    // attributes: ["id", "email"]
                },
                {
                    model: VendorQuotationItems,
                    as: "quotationItem",
                    // attributes: {
                    //     exclude: ["requisition_id"]
                    // },
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
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const create = asyncHandler(async (req, res) => {
    const { VendorQuotation, VendorQuotationItems, Requisition, Vendor } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {

        const { pr_id = "", vendor_id = "", status = "", note = "", items = [] } = req.body;
        if (!pr_id || !vendor_id) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });
        if (items.length == 0) return res.status(400).json({ success: false, code: 400, message: "Empty items not allow!!!" });

        const requisition = await Requisition.findByPk(pr_id);
        if (!requisition) return res.status(404).json({ success: false, code: 404, message: "No Requisition found!!!" });

        const vendor = await Vendor.findByPk(vendor_id);
        if (!vendor) return res.status(404).json({ success: false, code: 404, message: "No Vendor found!!!" });

        const quotation = await VendorQuotation.create({
            pr_id: parseInt(pr_id),
            vendor_id: parseInt(vendor_id),
            status,
            note
        }, { transaction });

        const total = items.reduce((accumulator, item) => accumulator + parseInt(item.total_price), 0);

        for (const item of items) {
            await VendorQuotationItems.create({
                quotation_id: quotation.id,
                ...item
            }, { transaction });
        }

        await VendorQuotation.update(
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
    const { VendorQuotation, Requisition, Vendor } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {

        const { id = "", pr_id = "", vendor_id = "", status = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Quotation id must required!!!" });

        const quotation = await quotation.findByPk(id);
        if (!quotation) return res.status(404).json({ success: false, code: 404, message: "Quotation not found!!!" });

        const requisition = await Requisition.findByPk(pr_id);
        if (!requisition) return res.status(404).json({ success: false, code: 404, message: "No Requisition found!!!" });

        const vendor = await Vendor.findByPk(vendor_id);
        if (!vendor) return res.status(404).json({ success: false, code: 404, message: "No Vendor found!!!" });

        let updateDetails = {};
        if (pr_id) updateDetails.pr_id = pr_id;
        if (vendor_id) updateDetails.vendor_id = vendor_id;
        if (status) updateDetails.status = status;
        if (note) updateDetails.note = note;

        const isUpdated = await VendorQuotation.update(
            updateDetails,
            { where: { id }, transaction }
        );
        if (!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        await transaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Quotation details updated." });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateQuotationItems = asyncHandler(async (req, res) => {
    const { VendorQuotationItems } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {

        const { id = "", quantity = "", unit_price = "", tax_percent = "", total_price = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const quotationItem = await VendorQuotationItems.findByPk(id);
        if (!quotationItem) return res.status(404).json({ success: false, code: 404, message: "Quotation Item not found!!!" });

        let updateDetails = {};
        if (quantity) updateDetails.quantity = quantity;
        if (unit_price) updateDetails.unit_price = unit_price;
        if (tax_percent) updateDetails.tax_percent = tax_percent;
        if (total_price) updateDetails.total_price = total_price;
        if (note) updateDetails.note = note;

        const isUpdated = await VendorQuotationItems.update(
            updateDetails,
            { where: { id }, transaction }
        );
        if (!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

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
    const { VendorQuotation } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await VendorQuotation.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allQuotation, create, updateQuotationItems, updateQuotationDetails, deleteQuotation };