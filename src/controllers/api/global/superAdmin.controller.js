import bcrypt from "bcrypt";
import SuperAdmin from "../../../models/global/SuperAdmin.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const superAdminCreated = asyncHandler(async (req, res) => {
    try {
        const { email = "", password = "", name = "" } = req.body;

        if (!email || !password || !name) return res.status(400).json({ success: false, code: 500, message: "All fields are required!!!" });

        const encryptPass = await hashPassword(password);

        await SuperAdmin.create({
            email,
            name,
            password: encryptPass
        })

        return res.status(200).json({ success: true, code: 200, message: "Super admin created." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const superAdminLogin = asyncHandler(async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });

        const superAdmin = await SuperAdmin.findOne({ where: { email } });
        if (!superAdmin) return res.status(404).json({ success: false, code: 404, message: "Admin not found!!!" });

        const is_password_matched = await bcrypt.compare(password, superAdmin.password);
        if (!is_password_matched) return res.status(401).json({ success: false, code: 401, message: "Password not matching!!!" });

        const token = jwt.sign(
            {
                id: superAdmin.id,
                isSuperAdmin: true
            },
            process.env.TOKEN_SECRET,
            {
                expiresIn: process.env.TOKEN_EXPIRY
            }
        );

        await SuperAdmin.update(
            { accessToken: token },
            { where: { email } }
        );

        return res.status(200).json({ success: true, code: 200, message: "Login successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const superAdminLogout = asyncHandler(async (req, res) => {
    try {

        const { id } = req.user;
        if ( !id ) return res.status(500).json({ success: false, code: 500, message: "id not found!!!" });

        await SuperAdmin.update(
            { accessToken: null },
            { where: { id } }
        );

        return res.status(200).json({ success: true, code: 200, message: "Logout successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteSuperAdmin = asyncHandler(async (req, res) => {
    try {

        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id required in params!!!" });

        await SuperAdmin.destroy({ where: { id } });

        return res.status(200).json({ success: true, code: 200, message: "Super admin deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// helper method
async function hashPassword(pass) {
    return await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10));
};

export { superAdminCreated, deleteSuperAdmin, superAdminLogin, superAdminLogout };