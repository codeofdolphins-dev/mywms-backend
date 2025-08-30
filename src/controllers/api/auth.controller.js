import jwt from "jsonwebtoken";
import { db_obj } from "../../db/config.js";
import CompanyDetails from "../../models/CompanyDetails.model.js";
import Role from "../../models/role.model.js";
import User from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt"
import Tenant from "../../models/global/Tenant.model.js";
import { seeder } from "../../helper/seeder.helper.js";

// GET request

const logout = asyncHandler(async (req, res) => {
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

    const transaction = await db_obj.transaction();

    try {
        const { email = "", password = "", c_name = "", ph_no = "" } = req.body;
        const profile_image = req?.file?.filename || null;

        if ([email, password, c_name].some(field => field === "")) {
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const tenant = await createTenent(c_name, transaction);

        await seeder(tenant.schemaName, transaction);

        const companyRole = await Role.findOne({ where: { role: "company" }, transaction });
        if (!companyRole) return res.status(400).json({ success: false, code: 400, message: "Role 'company' not found. Make sure roles are seeded." });

        const isRegister = await User.findOne({ where: { email } });
        if (isRegister) return res.status(400).json({ success: false, code: 400, message: `Company with email: ${email} already exists!!!` });

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email,
            password: encryptPassword,
        }, { transaction });

        await CompanyDetails.create({
            user_id: user.id,
            tenant_id: tenant.id,
            c_name,
            ph_no,
            profile_image
        }, { transaction });

        await user.addRole(companyRole, { transaction });

        await transaction.commit();

        if (user) return res.status(200).json({ success: true, code: 200, message: "Company Register Successfully." });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const login = asyncHandler(async (req, res) => {
    try {
        const { email = "", password = "" } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, code: 400, message: "Email and Password are required!" });

        const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

        if (!user) return res.status(400).json({ success: false, code: 400, message: "User Not Found!" });

        const is_password_matched = await bcrypt.compare(password, user.password);

        if (is_password_matched) {

            const roles = await user.getRoles();

            const roleName = roles.map(role => role.role);

            const token = jwt.sign(
                {
                    id: user.id,
                    role: roleName
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

            return res.status(200).json({ success: true, code: 200, message: "Login Successfully", token: token });
        }
        return res.status(401).json({ success: false, code: 401, message: "Wrong Password!" });

    } catch (error) {
        console.log(error);
        return res.status(400).json({ success: false, code: 400, message: error.message });
    };
});

const request_otp = asyncHandler(async (req, res) => {
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
            return res.status(200).json({ success: true, code: 200, message: "Password changed Successfully." });
        }

    } catch (error) {
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const resetPassword = asyncHandler(async (req, res) => {
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


// helper methods
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

async function hashPassword(pass) {
    return await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10));
}

async function createTenent(c_name, transaction) {
    return await Tenant.create({
        companyName: c_name,
        schemaName: `tenant_${c_name.split(" ")[0]}`
    }, { transaction });
}

export { register_company, login, logout, forgetPassword, resetPassword, request_otp, verify_otp };