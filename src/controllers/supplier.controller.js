import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/handelImage.js";
import { hashPassword } from "../utils/hashPassword.js";
import { rootDB } from "../db/tenantMenager.service.js";
import { removeFirstWord } from "../helper/removeFirstWord.js";

// GET
const supplierList = asyncHandler(async (req, res) => {
    const { Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        let { page = 1, limit = 10, id = "", text = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const supplier = await Supplier.findAndCountAll({
            where: {
                ...((id || text) ? {
                    [Op.or]: [
                        ...(id && Number.isInteger(Number(id))
                            ? [{ id: Number(id) }]
                            : []),
                        ...(text
                            ? [
                                { contact_email: { [Op.iLike]: `${text}%` } },
                                Sequelize.where(
                                    Sequelize.json("name.full_name"),
                                    { [Op.iLike]: `${text}%` }
                                ),
                                { contact_phone: { [Op.iLike]: `${text}%` } },
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
            ...(noLimit ? {} : { limit, offset }),
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
    const { Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id } = req.params;

        const supplier = await Supplier.findByPk(parseInt(id, 10));
        if (!supplier) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: 'Record Not found!!!' });
        }

        const isDelete = await Supplier.destroy({ where: { id }, transaction });
        if (!isDelete) throw new Error("Deletion Failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record deleted" });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const registerSupplier = asyncHandler(async (req, res) => {
    const { Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { email = "", full_name = "", phone_no = "", address = "", state = "", district = "", pincode = "", desc = "" } = req.body;

        if ([email, full_name, phone_no].some(item => item === "")) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const isSupplierExists = await Supplier.findOne({ where: { email }, transaction });
        if (isSupplierExists) {
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Supplier: ${full_name} with email: ${email} already exists!!!` });
        };

        const supplier = await Supplier.create({
            contact_email: email.toLowerCase().trim(),
            name: {
                full_name,
                first_name: full_name.split(" ")[0],
                last_name: removeFirstWord(full_name),
            },
            contact_phone: phone_no,
            address: {
                address,
                state,
                district,
                pincode
            },
            meta: {
                desc
            }
        }, { transaction });
        if (!supplier) throw new Error("Record not created!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Supplier added successfully." });

    } catch (error) {
        await transaction.rollback();
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