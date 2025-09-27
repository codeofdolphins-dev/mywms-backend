import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const vendorList = asyncHandler(async (req, res) => {
    const { Vendor, VendorBankDetails } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        let { page = 1, limit = 10, id = "", email = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const vendor = await Vendor.findAndCountAll({
            where: (id || email) ? { [Op.or]: [{ id: parseInt(id) || null }, { email }] } : undefined,
            include: [
                {
                    model: VendorBankDetails,
                    as: "BankDetails",
                    attributes: {
                        exclude: ["vendor_id"]
                    }
                }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
            transaction
        });
        if (!vendor) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = vendor.count;
        const totalPages = Math.ceil(totalItems / limit);

        await transaction.commit();

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: vendor,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        if(transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteVendor = asyncHandler(async (req, res) => {
    const { Vendor } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id } = req.params;

        const isExists = await Vendor.findOne({ where: { id }, transaction });
        if (!isExists) return res.status(404).json({ success: false, code: 404, message: `Vendor not found!!!` });

        await Vendor.destroy({ where: { id } });

        if (Vendor) return res.status(500).json({ success: false, code: 500, message: "Deletion failed!!!" });

        return res.status(200).status({ success: true, code: 200, message: "Vendor & Bank Details deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const registerVendor = asyncHandler(async (req, res) => {
    const { Vendor, VendorBankDetails } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { name = "", primary_phone = "", secondary_phone = "", email = "", address = "", gst_number = "", account_holder_name = "", bank_name = "", bank_branch = "", account_number = "", account_type = "", ifsc_code = "" } = req.body;

        if ([name, primary_phone, email, address, gst_number, account_holder_name, bank_branch, bank_name, account_number, account_type, ifsc_code].some(item => item === "")) return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });

        const isVendorExists = await Vendor.findOne({ where: { email }, transaction });
        if (isVendorExists) return res.status(409).json({ success: false, code: 409, message: `Vendor: ${name} with email: ${email} already exists!!!` });

        const isExists = await VendorBankDetails.findOne({ where: { account_number, ifsc_code }, transaction });
        if (isExists) return res.status(409).json({ success: false, code: 409, message: `Vendor: ${name} with account number: ${account_number} already exists!!!` });

        const vendor = await Vendor.create({
            name,
            primary_phone,
            secondary_phone,
            email,
            address,
            gst_number,
            transaction
        });
        const addVendorBank = await VendorBankDetails.create({
            vendor_id: vendor.id,
            account_holder_name,
            bank_name,
            bank_branch,
            account_number,
            account_type,
            ifsc_code,
            transaction
        })
        if (!addVendorBank) return res.status(500).json({ success: false, code: 500, message: "Bank details addition failed!!!" });

        await transaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Vendor & Bank details added successfully." });

    } catch (error) {
        if (!transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateVendorDetails = asyncHandler(async (req, res) => {
    const { Vendor } = req.dbModels;
    try {
        const { name, primary_phone, secondary_phone, email, address, gst_number } = req.body;
        if (!email) return res.status(400).json({ success: false, code: 400, message: "Vendor email required!!!" });

        const isVendorExists = await Vendor.findOne({ where: { email } });
        if (!isVendorExists) return res.status(404).json({ success: false, code: 404, message: `Vendor not found!!!` });

        let updateDetails = {};
        if (name) updateDetails.name = name;
        if (primary_phone) updateDetails.primary_phone = primary_phone;
        if (secondary_phone) updateDetails.secondary_phone = secondary_phone;
        if (address) updateDetails.address = address;
        if (gst_number) updateDetails.gst_number = gst_number;

        const vendor = await Vendor.update(
            updateDetails,
            { where: { email } }
        );
        if (!vendor) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Details Updated." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateVendorBankDetails = asyncHandler(async (req, res) => {
    const { VendorBankDetails } = req.dbModels;
    try {
        const { vendor_id = "", account_holder_name = "", bank_name = "", bank_branch = "", account_number = "", account_type = "", ifsc_code = "" } = req.body;
        if (!vendor_id) return res.status(400).json({ success: false, code: 400, message: "Vendor id must required!!!" });

        const isExists = await VendorBankDetails.findOne({ where: { vendor_id } });
        if (!isExists) return res.status(404).json({ success: false, code: 404, message: `Account not found!!!` });

        let updateDetails = {};
        if (account_holder_name) updateDetails.account_holder_name = account_holder_name;
        if (bank_name) updateDetails.bank_name = bank_name;
        if (bank_branch) updateDetails.bank_branch = bank_branch;
        if (account_number) updateDetails.account_number = account_number;
        if (account_type) updateDetails.account_type = account_type;
        if (ifsc_code) updateDetails.ifsc_code = ifsc_code;

        const bank = await VendorBankDetails.update(
            updateDetails,
            { where: { vendor_id } }
        );
        if (!bank) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Details Updated." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { vendorList, deleteVendor, registerVendor, updateVendorDetails, updateVendorBankDetails };