import { asyncHandler } from "../utils/asyncHandler.js";
import { Op } from "sequelize";

// GET
const currentUser = asyncHandler(async (req, res) => {
    const { User, Role, Permission, Warehouse, WarehouseType, UserType } = req.dbModels;
    try {
        const { id } = req.user;

        const user = await User.findByPk(id, {
            attributes: {
                exclude: ["password", "accessToken"]
            },
            include: [
                {
                    model: User,
                    as: "owner",
                },
                {
                    model: Warehouse,
                    as: "warehouseDetails",
                    include: [
                        {
                            model: WarehouseType,
                            as: "warehouseType"
                        }
                    ]
                },
                {
                    model: UserType,
                    as: "userType",
                    attributes: ["type"]
                },
                {
                    model: Role,
                    as: "roles",
                    attributes: ["role"],
                    through: { attributes: [] },
                    include: [
                        {
                            model: Permission,
                            as: "permissions",
                            attributes: ["permission"],
                            through: { attributes: [] }
                        }
                    ]
                }
            ]
        });
        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        const plainUser = user.get({ plain: true });

        if (plainUser.warehouseDetails === null) {
            delete plainUser.warehouseDetails;
        }
        if (plainUser.supplier === null) {
            delete plainUser.supplier;
        }
        if (plainUser.distributor === null) {
            delete plainUser.distributor;
        }

        plainUser.roles = plainUser.roles?.map(role => ({
            role: role.role,
            permissions:
                role.role === "company/owner"
                    ? "all access"
                    : role.role === "admin"
                        ? "all access"
                        : role.permissions?.map(p => p.permission) || []
        }));

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: plainUser });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


const allEmployeeList = asyncHandler(async (req, res) => {
    const { User, IndividualDetails } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", email = "", name = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const logginUser = req.user;

        const user = await User.findAndCountAll({
            where: {
                type: "user",
                owner_type: logginUser.type,
                ...(id || email ? {
                    [Op.or]: [
                        ...(id ? [{ id: parseInt(id, 10) }] : []),
                        ...(email ? [{ email }] : []),
                    ]
                } : undefined)
            },
            attributes: {
                exclude: ["password", "accessToken", "owner_id"]
            },
            include: [
                {
                    model: IndividualDetails,
                    as: "individualDetails",
                    required: !!name,
                    ...(name ? { where: { full_name: { [Op.iLike]: `%${name}%` } } } : {})
                }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        const totalItems = user.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: user.rows,
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

const warehouseEmployeeList = asyncHandler(async (req, res) => {
    const { User, IndividualDetails } = req.dbModels;
    try {
        const { warehouse_id = "" } = req.query;
        if (!warehouse_id) return res.status(400).json({ success: false, code: 400, message: "Warehouse id must required!!!" });

        const user = await User.findAll({
            where: { warehouse_id },
            attributes: ["id", "email", "createdAt", "updatedAt"],
            include: [
                {
                    model: IndividualDetails,
                    as: "individualDetails"
                }
            ]
        });
        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: plainUser });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateEmployeeDetails = asyncHandler(async (req, res) => {
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
const delete_employee = asyncHandler(async (req, res) => {
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


export { currentUser, allEmployeeList, updateEmployeeDetails, delete_employee };