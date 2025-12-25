import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/handelImage.js";
import { hashPassword } from "../utils/hashPassword.js";
import { rootDB } from "../db/tenantMenager.service.js";

// GET
const supplierList = asyncHandler(async (req, res) => {
    const { User, SupplierBankDetails, UserType } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        let { page = 1, limit = 10, id = "", text = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const userType = await UserType.findOne({
            where: {
                type: {
                    [Op.iLike]: "supplier"
                }
            }
        });

        // console.log(userType);
        // return


        const supplier = await User.findAndCountAll({
            where: {
                user_type_id: userType.id,
                ...((id || text) ? {
                    [Op.or]: [
                        ...(id && Number.isInteger(Number(id))
                            ? [{ id: Number(id) }]
                            : []),
                        ...(text
                            ? [
                                { email: { [Op.iLike]: `${text}%` } },
                                { full_name: { [Op.iLike]: `${text}%` } },
                                { company_name: { [Op.iLike]: `${text}%` } },
                                { phone_no: { [Op.iLike]: `${text}%` } },
                            ]
                            : []),
                    ]
                } : undefined)
            },
            attributes: {
                exclude: ["password", "user_type_id", "accessToken"]
            },
            include: [
                {
                    model: SupplierBankDetails,
                    as: "supplierBankDetails",
                }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
            transaction
        });
        if (!supplier) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = supplier.count;
        const totalPages = Math.ceil(totalItems / limit);

        await transaction.commit();

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: supplier.rows,
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
    const { User } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const { models, rootSequelize } = await rootDB();
    const { Tenant } = models;
    const rootTransaction = await rootSequelize.transaction();
    try {
        const { id } = req.params;

        const user = await User.findByPk(parseInt(id, 10));
        if (!user) {
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: 'Details Not found!!!' });
        }

        const isDelete = await User.destroy({ where: { id }, transaction });
        await Tenant.destroy({ where: { email: user.email }, transaction: rootTransaction });

        if (!isDelete) {
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: 'Deletion Failed!!!' });
        };

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Supplier & Bank Details deleted" });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        await rootTransaction.rollback();
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
        const { email = "", password = "", full_name = "", phone_no = "", address = "", state_id = "", district_id = "", pincode = "", company_name = "", account_holder_name = "", bank_name = "", bank_branch = "", account_number = "", account_type = "", ifsc_code = "", user_type = "", desc = "" } = req.body;
        const loginUser = req.user;


        if ([email, password, full_name, phone_no, address, state_id, district_id, pincode, account_holder_name, bank_branch, bank_name, account_number, account_type, ifsc_code, user_type].some(item => item === "")) {
            if (profile_image) deleteImage(profile_image, dbName);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const isUserExists = await User.findOne({ where: { email }, transaction });
        if (isUserExists) {
            if (profile_image) deleteImage(profile_image, dbName);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Supplier: ${full_name} with email: ${email} already exists!!!` });
        };

        const isBankExists = await SupplierBankDetails.findOne({ where: { account_number, ifsc_code }, transaction });
        if (isBankExists) {
            if (profile_image) deleteImage(profile_image, dbName);
            await rootTransaction.rollback();
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
            await rootTransaction.rollback();
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
            meta: {
                desc
            }
        }, { transaction });


        const addSupplierBank = await SupplierBankDetails.create({
            user_id: user.id,
            account_holder_name,
            bank_name,
            bank_branch,
            account_number,
            account_type,
            ifsc_code,
        }, { transaction })
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
    const { User, SupplierBankDetails } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const { models, rootSequelize } = await rootDB();
    const { Tenant } = models;
    const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;
    const dbName = req.headers["x-tenant-id"];
    try {
        const { id, email, password, full_name, phone_no, address, state_id, district_id, pincode, company_name, account_holder_name, bank_name, bank_branch, account_number, account_type, ifsc_code, desc } = req.body;
        if (!email || !id) {
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id and Email required!!!" });
        }

        const user = await User.findOne({ where: { email, id } });
        if (!user) {
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: `Supplier not found!!!` });
        };

        const userBankDetails = await SupplierBankDetails.findOne({ where: { user_id: user.id } });
        if (!userBankDetails) {
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: 'Supplier bank details not found!!!' });
        }

        const tenant = await Tenant.findOne({ where: { email } });
        if (!tenant) {
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: 'User tenant details not found!!!!' });
        }

        if (full_name) {
            user.full_name = full_name;
            user.first_name = full_name.split(" ")[0];
            user.last_name = full_name.split(" ").slice(1).join(" ");
        };
        if (password) {
            tenant.password = password;
            user.password = await hashPassword(password);
        }
        if (phone_no) user.phone_no = phone_no;
        if (company_name) user.company_name = company_name;
        if (profile_image) {
            const oldImage = user.profile_image;
            await deleteImage(oldImage);
            user.profile_image = `${dbName}/${profile_image}`;
        };

        if (address) user.address.address = address;
        if (state_id) user.address.state_id = state_id;
        if (district_id) user.address.district_id = district_id;
        if (pincode) user.address.pincode = pincode;

        if (desc) user.meta.desc = desc;

        if (account_holder_name) userBankDetails.account_holder_name = account_holder_name;
        if (bank_name) userBankDetails.bank_name = bank_name;
        if (bank_branch) userBankDetails.bank_branch = bank_branch;
        if (account_number) userBankDetails.account_number = account_number;
        if (account_type) userBankDetails.account_type = account_type;
        if (ifsc_code) userBankDetails.ifsc_code = ifsc_code;

        const isUserUpdate = await user.save({ transaction });
        await userBankDetails.save({ transaction });
        await tenant.save({ rootTransaction });

        if (!isUserUpdate) {
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: 'Updation failed!!!' });
        }
        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Details Updated." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        await rootTransaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { registerSupplier, supplierList, updateSupplierDetails, deleteSupplier };