import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt"
import { rootDB } from "../db/tenantMenager.service.js";
import path from "path";
import fs from "fs";
import { deleteImage, moveFile } from "../utils/handelImage.js";

// GET request
const logout = asyncHandler(async (req, res) => {
    const { User } = req.dbModels;
    try {
        const { id } = req.user;

        await User.update(
            { accessToken: null },
            { where: { id } }
        );

        return res.status(200).json({ success: true, code: 200, message: "Logged out successfully." });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message })
    };
});


// POST request
const register_company = asyncHandler(async (req, res) => {
    const transaction = await req.dbObject.transaction();
    const { CompanyDetails, Role, User } = req.dbModels;

    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();
    const profile_image = req?.file?.filename || null;

    try {
        const { email = "", password = "", c_name = "", ph_no = "" } = req.body;
        const dbName = req.headers["x-tenant-id"];
        // const isfileSave = req?.isfileSave === undefined ? false : req.isfileSave;
        const isfileSave = req?.isfileSave;
        let image_path = null;

        if ([email, password, c_name].some(field => field === "")) {
            if (profile_image) await deleteImage(profile_image);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const companyRole = await Role.findOne({ where: { role: "company/owner" }, transaction });
        if (!companyRole) {
            if (profile_image) await deleteImage(profile_image);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Role 'company' not found. Make sure roles are seeded." });
        }

        const isRegister = await User.findOne({ where: { email, type: "company/owner" }, transaction });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Company with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        if (!isfileSave && profile_image) {
            const ismoved = await moveFile(profile_image, dbName);
            image_path = ismoved ? `${dbName}/${profile_image}` : null;
        }
        image_path = profile_image ? `${dbName}/${profile_image}` : null;

        const user = await User.create({
            email,
            password: encryptPassword,
            type: "company/owner"
        }, { transaction });

        await CompanyDetails.create({
            user_id: user.id,
            c_name,
            ph_no,
            profile_image: image_path
        }, { transaction });

        await user.addRole(companyRole, { transaction });

        if (dbName === "mywms") {
            const tenantsName = await TenantsName.create({ tenant: dbName }, { transaction: rootTransaction });
            await Tenant.create({
                tenant_id: tenantsName.id,
                email,
                isOwner: true,
                companyName: c_name
            }, { transaction: rootTransaction });
        } else {
            await Tenant.update({
                password,
                companyName: c_name,
            }, {
                where: { email },
                transaction: rootTransaction
            });
        }
        if (!user) {
            if (profile_image) await deleteImage(profile_image);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Company Register Failed!!!" });
        }

        await rootTransaction.commit();
        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Company Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image);
        if (transaction) await transaction.rollback();
        if (rootTransaction) await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const register_employee = asyncHandler(async (req, res) => {
    const dbObject = req.dbObject;
    const transaction = await dbObject.transaction();
    const { IndividualDetails, Role, User } = req.dbModels;

    // const { models, rootSequelize } = await rootDB();
    // const { Tenant, TenantsName } = models;
    // const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;

    try {
        const { email = "", password = "", full_name = "", phone = "", address = "", state_id = "", district_id = "", pincode = "" } = req.body;
        const dbName = req.headers["x-tenant-id"];
        const loginUser = req.user;

        // const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } }, { transaction: rootTransaction });
        // if (!tenantsName) {
        //     if (profile_image) await deleteImage(profile_image);
        //     await transaction.rollback();
        //     await rootTransaction.rollback();
        //     return res.status(501).json({ success: false, code: 501, message: "Not Implemented, database not found!!!" });
        // }

        if ([email, password, full_name].some(field => field === "")) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const userRole = await Role.findOne({ where: { role: "user" } }, { transaction });
        if (!userRole) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Role 'user' not found. Make sure roles are seeded." });
        }

        const isRegister = await User.findOne({ where: { email, type: "user" } }, { transaction });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Employee with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email,
            password: encryptPassword,
            type: "user",
            owner_type: loginUser.type,
            owner_id: loginUser.id
        }, { transaction });

        await IndividualDetails.create({
            user_id: user.id,
            first_name: full_name.split(" ")[0],
            last_name: full_name.split(" ")[1],
            full_name,
            phone,
            address,
            state_id,
            district_id,
            pincode,
            profile_image: profile_image ? `${dbName}/${profile_image}` : null
        }, { transaction });

        await user.addRole(userRole, { transaction });
        // await Tenant.create({ tenant_id: tenantsName.id, email }, { transaction: rootTransaction });

        if (!IndividualDetails) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(200).json({ success: true, code: 200, message: "User Registration failed!!!" });
        }

        await transaction.commit();
        // await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "User Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image);
        await transaction.rollback();
        // await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const register_supplier = asyncHandler(async (req, res) => {
    const dbObject = req.dbObject;
    const transaction = await dbObject.transaction();
    const { Supplier, Role, User } = req.dbModels;

    // const { models, rootSequelize } = await rootDB();
    // const { Tenant, TenantsName } = models;
    // const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;

    try {
        const { email = "", password = "", full_name = "", company_name = "", phone = "", address = "", state_id = "", district_id = "", pincode = "", desc = "" } = req.body;
        const dbName = req.headers["x-tenant-id"];

        // const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } }, { transaction: rootTransaction });
        // if (!tenantsName) {
        //     if (profile_image) await deleteImage(profile_image);
        //     await transaction.rollback();
        //     await rootTransaction.rollback();
        //     return res.status(501).json({ success: false, code: 501, message: "Not Implemented, database not found!!!" });
        // }

        if ([email, password, full_name, phone, company_name].some(field => field === "")) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const userRole = await Role.findOne({ where: { role: "supplier" } }, { transaction });
        if (!userRole) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Role 'supplier' not found. Make sure roles are seeded." });
        }

        const isRegister = await User.findOne({ where: { email, type: "supplier" } }, { transaction });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Supplier with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email,
            password: encryptPassword,
            type: "supplier",
        }, { transaction });

        const supplier = await Supplier.create({
            user_id: user.id,
            company_name,
            contact_person: full_name,
            phone,
            address,
            state_id,
            district_id,
            pincode,
            profile_image: profile_image ? `${dbName}/${profile_image}` : null,
            desc
        }, { transaction });

        await user.addRole(userRole, { transaction });
        // await Tenant.create({ tenant_id: tenantsName.id, email }, { transaction: rootTransaction });

        if (!supplier) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(200).json({ success: true, code: 200, message: "Supplier Registration failed!!!" });
        }

        await transaction.commit();
        // await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Supplier Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image);
        await transaction.rollback();
        // await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const register_distributor = asyncHandler(async (req, res) => {
    const dbObject = req.dbObject;
    const transaction = await dbObject.transaction();
    const { Distributor, Role, User } = req.dbModels;

    // const { models, rootSequelize } = await rootDB();
    // const { Tenant, TenantsName } = models;
    // const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;

    try {
        const { email = "", password = "", full_name = "", phone = "", alter_phone = null, address = "", state_id = "", district_id = "", pincode = "", desc = "" } = req.body;
        const dbName = req.headers["x-tenant-id"];

        // const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } }, { transaction: rootTransaction });
        // if (!tenantsName) {
        //     if (profile_image) await deleteImage(profile_image);
        //     await transaction.rollback();
        //     await rootTransaction.rollback();
        //     return res.status(501).json({ success: false, code: 501, message: "Not Implemented, database not found!!!" });
        // }

        if ([email, password, full_name, phone].some(field => field === "")) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const userRole = await Role.findOne({ where: { role: "distributor" } }, { transaction });
        if (!userRole) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Role 'distributor' not found. Make sure roles are seeded." });
        }

        const isRegister = await User.findOne({ where: { email, type: "distributor" } }, { transaction });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Distributor with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email,
            password: encryptPassword,
            type: "distributor",
        }, { transaction });

        const distributor = await Distributor.create({
            user_id: user.id,
            name: full_name,
            phone,
            alter_phone,
            address,
            state_id,
            district_id,
            pincode,
            profile_image: profile_image ? `${dbName}/${profile_image}` : null,
            desc
        }, { transaction });

        await user.addRole(userRole, { transaction });
        // await Tenant.create({ tenant_id: tenantsName.id, email }, { transaction: rootTransaction });

        if (!distributor) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(200).json({ success: true, code: 200, message: "Distributor Registration failed!!!" });
        }

        await transaction.commit();
        // await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Distributor Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image);
        await transaction.rollback();
        // await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const register_warehouse = asyncHandler(async (req, res) => {
    const { User, Warehouse, Role } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const profile_image = req?.file?.filename || null;

    try {
        const { email = "", password = "", full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", gst_no = "", license_no = "", lat = "", long = "" } = req.body;
        const dbName = req.headers["x-tenant-id"];
        const loginUser = req.user;

        if ([full_name, ph_number, address, state_id, district_id, pincode, gst_no, license_no].some(item => item === "")) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        const userRole = await Role.findOne({ where: { role: "warehouse" } }, { transaction });
        if (!userRole) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            // await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Role 'distributor' not found. Make sure roles are seeded." });
        }

        const isRegister = await User.findOne({ where: { email, type: "warehouse" } }, { transaction });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Warehouse with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email,
            password: encryptPassword,
            type: "warehouse",
            owner_type: loginUser.type,
            owner_id: loginUser.id
        }, { transaction });

        const warehouse = await Warehouse.create({
            user_id: user.id,
            full_name,
            f_name: full_name.split(" ")[0],
            l_name: full_name.split(" ")[1],
            ph_number,
            profile_image: profile_image ? `${dbName}/${profile_image}` : null,
            address,
            state_id,
            district_id,
            pincode,
            gst_no,
            license_no,
            lat,
            long,
        }, { transaction });

        await user.addRole(userRole, { transaction });

        await transaction.commit();

        if (!warehouse) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Warehouse creation failed!!!" });
        }

        return res.status(200).json({ success: true, code: 200, message: "Warehouse Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image);
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const login = asyncHandler(async (req, res) => {
    const { User, CompanyDetails, IndividualDetails, Role } = req.dbModels;
    try {
        const { email = "", password = "" } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, code: 400, message: "Email and Password are required!" });

        const user = await User.findOne({
            where: { email: email.toLowerCase().trim() },
            attributes: ["id", "email", "password"],
            include: [
                {
                    model: CompanyDetails,
                    as: "companyDetails",
                    attributes: ["c_name"]
                },
                {
                    model: IndividualDetails,
                    as: "individualDetails",
                    attributes: ["full_name"]
                },
                {
                    model: Role,
                    as: "roles",
                    attributes: ["role"],
                    through: { attributes: [] }
                }
            ]
        });
        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        const is_password_matched = await bcrypt.compare(password, user.password);

        if (is_password_matched) {
            const roles = user.roles.map(role => role.role);
            const isAdmin = ["admin", "company/owner"].some(role => roles.includes(role));

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.roles,
                    isAdmin
                },
                process.env.TOKEN_SECRET,
                {
                    expiresIn: process.env.TOKEN_EXPIRY
                }
            );

            await User.update(
                { accessToken: token },
                { where: { email } }
            );

            const plainUser = user.get({ plain: true });

            delete plainUser.password;
            plainUser.roles = roles;

            if (plainUser.companyDetails !== null) {
                delete plainUser.individualDetails;
                plainUser.c_name = plainUser.companyDetails.c_name;
                delete plainUser.companyDetails;

            } else if (plainUser.individualDetails !== null) {
                delete plainUser.companyDetails;
                plainUser.full_name = plainUser.individualDetails.full_name;
                delete plainUser.individualDetails;
            };

            return res.status(200).json({ success: true, code: 200, message: "Login Successfully", token: token, tenant: req.headers['x-tenant-id'], data: plainUser });
        }
        return res.status(401).json({ success: false, code: 401, message: "Wrong Password!" });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message });
    };
});

const request_otp = asyncHandler(async (req, res) => {
    const { User } = req.dbModels;
    try {
        const { email = "" } = req.body;

        if (!email) return res.status(400).json({ success: false, code: 400, message: "Email must required!" });

        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
        if (!user) return res.status(400).json({ success: false, code: 400, message: "User Not Found!" });

        const otp = generateOTP();

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .cookie("otp", otp, options)
            .json({ success: true, code: 200, message: "OTP send successfully", otp });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message });
    }
});

const verify_otp = asyncHandler(async (req, res) => {
    const { User } = req.dbModels;
    try {
        const { email = "", userOTP = "" } = req.body;

        if (!email) return res.status(400).json({ success: false, code: 400, message: "Email must required!" });

        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) return res.status(400).json({ success: false, code: 400, message: "User Not Found!" });

        if (userOTP !== req.cookies.otp) return res.status(400).json({ success: false, code: 400, message: "Wrong OTP!" });

        const options = {
            httpOnly: true,
            secure: true
        };

        return res
            .status(200)
            .clearCookie("otp", options)
            .cookie("is_otp", true, options)
            .json({ success: true, code: 200, message: "OTP Verified." });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message });
    }
});

const forgetPassword = asyncHandler(async (req, res) => {
    const { User } = req.dbModels;
    try {
        const { email = "", password = "" } = req.body;

        if (!email) return res.status(400).json({ success: false, code: 400, message: "Email must required!" });
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, code: 404, message: "user not found!" });

        if (password && req.cookies.is_otp) {
            const encryptPassword = await hashPassword(password);

            await User.update(
                { password: encryptPassword },
                { where: { id: user.id } }
            );

            const options = {
                httpOnly: true,
                secure: true
            };

            return res
                .status(200)
                .clearCookie("is_otp", options)
                .json({ success: true, code: 200, message: "Password changed Successfully." });
        }

        return res.status(400).json({ success: false, code: 400, message: "Link Expired!!! Verify email again." });

    } catch (error) {
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { User } = req.dbModels;
    try {

        const { oldPassword = "", newPassword = "" } = req.body;
        const { email } = req.user;

        if (!oldPassword && !newPassword) return res.status(400).json({ success: false, code: 400, message: "Both password are required!" });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ success: false, code: 404, message: "user not found!" });

        const isPassMatched = await bcrypt.compare(oldPassword, user.password);

        if (!isPassMatched) return res.status(400).json({ success: false, code: 400, message: "Old Password wrong!" });

        const encryptPassword = await hashPassword(newPassword);

        await User.update(
            { password: encryptPassword },
            { where: { email } }
        );
        return res.status(200).json({ success: true, code: 200, message: "Password reset Successfully." });

    } catch (error) {
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { register_company, register_employee, register_supplier, register_distributor, register_warehouse, login, logout, forgetPassword, resetPassword, request_otp, verify_otp };

// helper methods
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

async function hashPassword(pass) {
    return await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10));
}