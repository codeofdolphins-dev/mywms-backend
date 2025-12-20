import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/handelImage.js";
import { hashPassword } from "../utils/hashPassword.js";
import { rootDB } from "../db/tenantMenager.service.js";

// GET
const supplierList = asyncHandler(async (req, res) => {
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
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteSupplier = asyncHandler(async (req, res) => {
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
const registerSupplier = asyncHandler(async (req, res) => {
    const { User, SupplierBankDetails, UserType } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;
    const dbName = req.headers["x-tenant-id"];

    try {
        const { email = "", password = "", full_name = "", phone_no = "", address = "", state_id = "", district_id = "", pincode = "", company_name = "", account_holder_name = "", bank_name = "", bank_branch = "", account_number = "", account_type = "", ifsc_code = "", user_type = "" } = req.body;
        const loginUser = req.user;


        if ([email, password, full_name, phone_no, address, state_id, district_id, pincode, account_holder_name, bank_branch, bank_name, account_number, account_type, ifsc_code, user_type].some(item => item === "")) {
            if (profile_image) deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const isUserExists = await User.findOne({ where: { email }, transaction });
        if (isUserExists) {
            if (profile_image) deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Supplier: ${full_name} with email: ${email} already exists!!!` });
        };

        const isBankExists = await SupplierBankDetails.findOne({ where: { account_number, ifsc_code }, transaction });
        if (isBankExists) {
            if (profile_image) deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Supplier: ${full_name} with account number: ${account_number} already exists!!!` });
        };

        const userType = await UserType.findOne({
            where: {
                type: {
                    [Op.iLike]: user_type
                }
            }
        });
        if (!userType) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "User type not found. Make sure user type are seeded." });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: encryptPassword,
            user_type_id: userType.id,
            full_name,
            first_name: full_name.split(" ")[0],
            last_name: full_name.split(" ")?.[1] || '',
            phone_no,
            ...(profile_image && { profile_image: `${dbName}/${profile_image}` }),
            address: {
                address,
                state_id,
                district_id,
                pincode
            },
            ...(company_name && { company_name }),
            owner_id: loginUser.id,
            owner_type: loginUser.userType?.type,
        }, { transaction });


        const addSupplierBank = await SupplierBankDetails.create({
            user_id: user.id,
            account_holder_name,
            bank_name,
            bank_branch,
            account_number,
            account_type,
            ifsc_code,
            transaction
        })
        if (!addSupplierBank) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Bank details addition failed!!!" });
        }

        const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } });
        await Tenant.create({
            tenant_id: tenantsName.id,
            email,
            password,
            ...(company_name && { companyName: company_name })
        }, { transaction: rootTransaction });

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Supplier & Bank details added successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image, dbName);
        await transaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateSupplierDetails = asyncHandler(async (req, res) => {
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

const updateSupplierBankDetails = asyncHandler(async (req, res) => {
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

export { registerSupplier };