import { asyncHandler } from "../utils/asyncHandler.js";

// GET request
const allRoles = asyncHandler(async (req, res) => {
    const { Role } = req.dbModels;
    try {
        const roles = await Role.findAll();

        return res.status(200).json({ success: true, code: 200, message: "Roles fetched successfully.", data: roles });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request
const addRole = asyncHandler(async (req, res) => {
    const { Role } = req.dbModels;
    try {
        const { newRole, status } = req.body;

        const isExists = await Role.findOne({ where: { role: newRole.toLowerCase().trim() } });

        if (isExists) return res.status(400).json({ success: false, code: 400, message: "Role already exists!!!" });

        await Role.create({ role: newRole.toLowerCase().trim(), status });

        return res.status(200).json({ success: true, code: 200, message: "Role Added." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, code: 500, message: error.message });
    }
});

const deleteRole = asyncHandler(async (req, res) => {
    const { Role } = req.dbModels;
    try {

        const id = req.params.id;

        const isDelete = await Role.destroy({ where: { id } });

        if (!isDelete) return res.status(400).json({ success: false, code: 400, message: "Not Delete!" })

        return res.status(200).json({ success: true, code: 200, message: "Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editRole = asyncHandler(async (req, res) => {
    const { Role } = req.dbModels;
    try {
        const { id, newRole = "", status = ""  } = req.body;
        if(!id) return res.status(400).json({ success: false, code: 400, message: "ID must required!!!" });

        const role = await Role.update(
            { 
                role: newRole.toLowerCase().trim(),
                status
            },
            { where: { id } }
        );
        if(!role) return res.status(500).json({ success: false, code: 400, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updation successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const assignRole = asyncHandler(async (req, res) => {
    const { User, Role } = req.dbModels;
    try {
        const { userId = "", userRole = "" } = req.body;

        if (!userId || !userRole) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });

        const user = await User.findByPk(userId);
        const role = await Role.findOne({ where: { role: userRole } });

        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });
        if (!role) return res.status(400).json({ success: false, code: 400, message: "Role not found!!!" });

        await user.addRole(role);

        return res.status(200).json({ success: true, code: 200, message: "Role Assigned Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const removeRole = asyncHandler(async (req, res) => {
    const { User, Role } = req.dbModels;
    const transaction = req.dbObject.transaction();

    try {
        const { userId = "", userRole = "" } = req.body;

        if (!userId || !userRole) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });

        const user = await User.findByPk(userId, { transaction });
        const role = await Role.findOne({ where: { role: userRole } }, { transaction });

        if (!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });
        if (!role) return res.status(400).json({ success: false, code: 400, message: "Role not found!!!" });

        await user.removeRole(role, { transaction });

        await transaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Role Removed." });

    } catch (error) {
        console.log(error);
        if (transaction) await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { editRole, deleteRole, addRole, allRoles, assignRole, removeRole };