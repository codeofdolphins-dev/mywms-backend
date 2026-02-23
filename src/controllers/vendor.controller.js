import { rootDB } from "../db/tenantMenager.service.js";
import { hashPassword } from "../helper/hashPassword.js";
import { removeFirstWord } from "../helper/removeFirstWord.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Op, Sequelize } from "sequelize";
import bcrypt from "bcrypt";

// GET
export const allVendorList = asyncHandler(async (req, res) => {
    const { Vendor, VendorCategory } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", text = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const vendor = await Vendor.findAndCountAll({
            where: {
                ...(id && { id }),
                ...(text ? {
                    [Op.or]: [
                        { email: { [Op.iLike]: `${text}%` } },
                        Sequelize.where(
                            Sequelize.json("name.full_name"),
                            { [Op.iLike]: `${text}%` }
                        ),
                        { phone: { [Op.iLike]: `${text}%` } },
                    ]
                } : {}),
            },
            attributes: {
                exclude: ["password", "access_token"]
            },
            include: [
                {
                    model: VendorCategory,
                    as: "vendorCategory",
                },
            ],
            ...(noLimit && { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        if (!vendor) return res.status(404).json({ success: false, code: 404, message: "Vendor not found!!!" });

        const totalItems = vendor.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: id ? vendor.rows[0] : vendor.rows,
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

export const vendorLogin = asyncHandler(async (req, res) => {
    const { Vendor } = req.dbModels;

    try {
        const { email = "", password = "" } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, code: 400, message: "Email and Password are required!" });

        const vendor = await Vendor.findOne({
            where: { email: email.toLowerCase().trim() },
            attributes: ["id", "email", "password"],
        });
        if (!vendor) return res.status(404).json({ success: false, code: 404, message: "Vendor not found!!!" });

        const is_password_matched = await bcrypt.compare(password, vendor.password);

        if (is_password_matched) {
            const token = jwt.sign(
                {
                    id: user.id,
                },
                process.env.TOKEN_SECRET,
                {
                    expiresIn: process.env.TOKEN_EXPIRY
                }
            );

            await vendor.update(
                { access_token: token }
            );

            return res.status(200).json({ success: true, code: 200, message: "Login Successfully", token: token, tenant: req.headers['x-tenant-id'] });
        }
        return res.status(401).json({ success: false, code: 401, message: "Wrong Password!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const registerVendor = asyncHandler(async (req, res) => {

    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();

    const { Vendor, VendorCategory } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const dbName = req.headers["x-tenant-id"];

    try {
        const { email = "", password = "", full_name = "", vendor_category_id = "", gst_no = "", phone = "", company_name = "" } = req.body;

        if (
            [email, full_name, phone, password, vendor_category_id].some(item => item === "")
        ) throw new Error("Required fields are missing!!!");

        const vendorCategory = await VendorCategory.findByPk(Number(vendor_category_id));
        if (!vendorCategory) throw new Error("Category record not found!!!");

        const isExists = await Vendor.findOne({ where: { email } });
        if (isExists) throw new Error(`Vendor with email: ${email} already exists!!!`);

        const hashPass = await hashPassword(password);

        await Vendor.create({
            email,
            password: hashPass,
            phone,
            name: {
                full_name,
                first_name: full_name.split(" ")[0],
                last_name: removeFirstWord(full_name),
            },
            vendor_category_id: vendorCategory.id,
            gst_no,
            company_name
        }, { transaction })


        const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } });
        await Tenant.create({
            tenant_id: tenantsName.id,
            email,
            password,
            companyName: company_name
        }, { transaction: rootTransaction });

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        console.log(error);
        if (transaction) await transaction.rollback();
        if (rootTransaction) await rootTransaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateVendorDetails = asyncHandler(async (req, res) => {
    const { IndividualDetails } = req.dbModels;
    try {
        const { individualDetails } = req.user || null;
        const { full_name = "", phone = "", address = "", state_id = "", district_id = "", pincode = "" } = req.body;
        const profile_image = req?.file?.filename || null;

        let updateDetails = {};
        if (full_name) updateDetails.full_name = full_name;
        if (phone) updateDetails.phone = phone;
        if (address) updateDetails.address = address;
        if (state_id) updateDetails.state_id = state_id;
        if (district_id) updateDetails.district_id = district_id;
        if (pincode) updateDetails.pincode = pincode;

        if (profile_image) {
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                updateDetails.profile_image
            );

            // Safely unlink if file exists
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            individualDetails.profile_image = profile_image;
        }

        const isUpdated = await IndividualDetails.update({
            updateDetails,
            where: { id: individualDetails.id },
        });

        if (!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Employee details updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteVendor = asyncHandler(async (req, res) => {
    const { User, IndividualDetails } = req.dbModels;
    try {
        const { targetEmail, adminPassword } = req.body;
        if (!targetEmail || !adminPassword) return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        const userDetails = req.user;

        const user = await User.findOne({
            where: { email: targetEmail },
            include: [
                {
                    model: IndividualDetails,
                    as: "individualDetails"
                }
            ]
        });
        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        const admin = await User.findByPk(userDetails.id);

        const is_password_matched = await bcrypt.compare(adminPassword, admin.password);

        if (!is_password_matched) return res.status(401).json({ success: false, code: 401, message: "Wrong password!!!" });

        if (user.individualDetails.profile_image !== null) {
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                user.individualDetails.profile_image
            );
            if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }

        const isDeleted = await user.destroy({ where: { email: targetEmail } });

        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion filled!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Employee successfully deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});
