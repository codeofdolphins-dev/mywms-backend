import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt"
import { rootDB } from "../db/tenantMenager.service.js";
import { deleteImage, moveFile } from "../utils/handelImage.js";
import { hashPassword } from "../utils/hashPassword.js";
import { removeFirstWord } from "../helper/removeFirstWord.js";

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
    const { Role, User } = req.dbModels;

    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();
    const profile_image = req?.file?.filename || null;

    try {
        const { email = "", password = "", c_name = "", ph_no = "" } = req.body;
        const dbName = req.headers["x-tenant-id"];
        const isfileSave = req?.isfileSave;
        let image_path = null;


        if ([email, password, c_name].some(field => field === "")) {
            if (profile_image) await deleteImage(profile_image);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        };

        const companyRole = await Role.findOne({ where: { role: "company" }, transaction });
        if (!companyRole) {
            if (profile_image) await deleteImage(profile_image);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Role 'company/owner' not found. Make sure roles are seeded." });
        }

        const isRegister = await User.findOne({ where: { email }, transaction });
        if (isRegister) {
            if (profile_image && isfileSave) await deleteImage(profile_image, dbName);
            else if (profile_image && !isfileSave) await deleteImage(profile_image);
            await rootTransaction.rollback();
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Company with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        if (!isfileSave && profile_image) {
            const ismoved = await moveFile(profile_image, dbName);
            image_path = ismoved ? `${dbName}/${profile_image}` : null;
        }

        const user = await User.create({
            email,
            password: encryptPassword,
            phone_no: ph_no,
            company_name: c_name,
            is_owner: true,
            ...(image_path && { profile_image: image_path }),
        }, { transaction });

        await user.addRole(companyRole, { transaction });

        if (dbName === "mywms") {
            const [tenant, _] = await TenantsName.findOrCreate({
                where: { tenant: dbName },
                defaults: { tenant: dbName },
                transaction: rootTransaction
            });
            await Tenant.create({
                tenant_id: tenant.id,
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

const registeredUserWithNodes = asyncHandler(async (req, res) => {

    const { User } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;
    const dbName = req.headers["x-tenant-id"];

    try {
        let { email = "", password = "", full_name = "", phone_no = "", node = "", node_type = "" } = req.body;
        const loginUser = req.user;

        if (
            [email, full_name, phone_no, password].some(item =>
                item === ""
            )
        ) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        if (node) node = JSON.parse(node);

        const isRegister = await User.findOne({ where: { email } });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `User with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: encryptPassword,
            name: {
                full_name,
                first_name: full_name.split(" ")[0],
                last_name: removeFirstWord(full_name),
            },
            phone_no,
            ...(profile_image && { profile_image: `${dbName}/${profile_image}` }),
            company_name: loginUser.company_name,
        }, { transaction });


        const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } });
        await Tenant.create({
            tenant_id: tenantsName.id,
            email,
            password,
            companyName: loginUser.company_name
        }, { transaction: rootTransaction });


        /** link user with node if node available */
        if (node) {
            await user.addUserBusinessNode(node.id, {
                through: { userRole: node_type },
                transaction
            });
        }

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image, dbName);
        await transaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateUser = asyncHandler(async (req, res) => {

    // console.log(req.body); 
    // console.log(JSON.parse(req.body.node));

    // return

    const { User } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const { models, rootSequelize } = await rootDB();
    const { Tenant } = models;
    const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;
    const dbName = req.headers["x-tenant-id"];

    try {
        let { id, email = "", password = "", full_name = "", phone_no = "" } = req.body;

        if (!id || !email) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id & email both must required!!!" });
        }

        const user = await User.findByPk(Number(id));
        if (!user) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `User with id not found!!!` });
        }

        if (full_name) {
            user.name = {
                full_name,
                first_name: full_name.split(" ")[0],
                last_name: removeFirstWord(full_name),
            }
        }
        if (phone_no) user.phone_no = phone_no;
        if (profile_image) {
            await deleteImage(user.profile_image, dbName);
            user.profile_image = `${dbName}/${profile_image}`;
        }
        if (password) user.password = await hashPassword(password);


        const tenant = await Tenant.findOne({ where: { email: user.email } });
        if (password) tenant.password = password;


        /** last save all updates */
        await user.save({ transaction });
        await tenant.save({ transaction: rootTransaction });


        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image, dbName);
        await transaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// const user_registration = asyncHandler(async (req, res) => {
//     const { User, Warehouse, WarehouseType, UserType } = req.dbModels;
//     const transaction = await req.dbObject.transaction();

//     const { models, rootSequelize } = await rootDB();
//     const { Tenant, TenantsName } = models;
//     const rootTransaction = await rootSequelize.transaction();

//     const profile_image = req?.file?.filename || null;
//     const dbName = req.headers["x-tenant-id"];

//     try {
//         const { email = "", password = "", full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", company_name = "", user_type = "" } = req.body;
//         const loginUser = req.user;

//         if ([email, full_name, ph_number, address, state_id, district_id, pincode].some(item => item === "")) {
//             if (profile_image) await deleteImage(profile_image);
//             await transaction.rollback();
//             return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
//         }

//         const isRegister = await User.findOne({ where: { email } });
//         if (isRegister) {
//             if (profile_image) await deleteImage(profile_image);
//             await transaction.rollback();
//             return res.status(400).json({ success: false, code: 400, message: `User with email: ${email} already exists!!!` });
//         }

//         const encryptPassword = await hashPassword(password);

//         const user = await User.create({
//             email: email.toLowerCase().trim(),
//             password: encryptPassword,
//             // user_type_id: userType.id,
//             name: {
//                 full_name,
//                 first_name: full_name.split(" ")[0],
//                 last_name: full_name.split(" ")?.[1] || '',
//             },
//             phone_no: ph_number,
//             ...(profile_image && { profile_image: `${dbName}/${profile_image}` }),
//             address: {
//                 address,
//                 state_id,
//                 district_id,
//                 pincode
//             },
//             ...(company_name && { company_name }),
//             owner_id: loginUser.id,
//             owner_type: loginUser.userType?.type,
//         }, { transaction });

//         const typeInLower = userType.type.toLowerCase();
//         const isWarehouse = typeInLower.includes("warehouse");
//         if (isWarehouse) {
//             const warehouse = await registerWarehouse(req, user, Warehouse, WarehouseType, userType.type, transaction);
//             if (!warehouse) {
//                 if (profile_image) await deleteImage(profile_image);
//                 await transaction.rollback();
//                 return res.status(500).json({ success: false, code: 500, message: "Creation failed!!!" });
//             }
//         }

//         const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } });
//         await Tenant.create({
//             tenant_id: tenantsName.id,
//             email,
//             password,
//             ...(company_name && { companyName: company_name })
//         }, { transaction: rootTransaction });

//         await transaction.commit();
//         await rootTransaction.commit();
//         return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

//     } catch (error) {
//         if (profile_image) await deleteImage(profile_image);
//         await rootTransaction.rollback();
//         await transaction.rollback();
//         console.log(error);
//         return res.status(500).json({ success: false, code: 500, message: error.message });
//     }
// });

const login = asyncHandler(async (req, res) => {
    const { User, Role } = req.dbModels;
    try {
        const { email = "", password = "" } = req.body;

        if (!email || !password) return res.status(400).json({ success: false, code: 400, message: "Email and Password are required!" });

        const user = await User.findOne({
            where: { email: email.toLowerCase().trim() },
            attributes: ["id", "email", "password"],
            include: [
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
            const isAdmin = ["system", "owner", "company", "admin"].some(role => roles.includes(role));

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

            await user.update(
                { accessToken: token }
            );

            const plainUser = user.get({ plain: true });

            delete plainUser.password;
            plainUser.roles = roles;

            return res.status(200).json({ success: true, code: 200, message: "Login Successfully", token: token, tenant: req.headers['x-tenant-id'] });
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


export { register_company, login, logout, forgetPassword, resetPassword, request_otp, verify_otp, registeredUserWithNodes, updateUser };

/** ================================== helper =============================== */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};