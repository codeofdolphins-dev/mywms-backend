import { db_obj } from "../../db/config.js";
import Role from "../../models/role.model.js";
import User from "../../models/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// GET request

const allRoles = asyncHandler(async (req, res) => {
    try {
        const roles = await Role.schema(req.schemaName).findAll();

        return res.status(200).json({ success: true, code: 200, message: "Roles fetched successfully.", roles });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request
const addRole = asyncHandler(async (req, res) => {
    try {
        const { newRole } = req.body;

        const isExists = await Role.schema(req.schemaName).findOne({ where: { role: newRole.toLowerCase().trim() } });

        if (isExists) return res.status(400).json({ success: false, code: 400, message: "Role already exists!!!" });

        await Role.schema(req.schemaName).create({ role: newRole.toLowerCase().trim() });

        return res.status(200).json({ success: true, code: 200, message: "Role Added." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, code: 500, message: error.message });
    }
});

const deleteRole = asyncHandler(async (req, res) => {
    try {

        const id = req.params.id;

        const isDelete = await Role.schema(req.schemaName).destroy({ where: { id } });

        if(!isDelete) return res.status(400).json({ success: false, code: 400, message: "Not Delete!" })

        return res.status(200).json({ success: true, code: 200, message: "Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editRole = asyncHandler(async (req, res) => {
    try {
        const { id, newRole } = req.body;

        await Role.schema(req.schemaName).update(
            { role: newRole.toLowerCase().trim() },
            { where: { id } }
        );

        return res.status(200).json({ success: true, code: 200, message: "Updation successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const assignRole = asyncHandler(async (req, res) => {
    try {        
        const { userId = "", userRole = "" } = req.body;

        if(!userId || !userRole) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });

        const user = await User.schema(req.schemaName).findByPk(userId);
        const role = await Role.schema(req.schemaName).findOne({ where: { role: userRole } });

        if(!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });
        if(!role) return res.status(400).json({ success: false, code: 400, message: "Role not found!!!" });

        await user.schema(req.schemaName).addRole(role);

        return res.status(200).json({ success: true, code: 200, message: "Role Assigned Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const removeRole = asyncHandler(async (req, res) => {

    const transaction = db_obj.transaction();

    try {        
        const { userId = "", userRole = "" } = req.body;

        if(!userId || !userRole) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });

        const user = await User.schema(req.schemaName).findByPk(userId, { transaction });
        const role = await Role.schema(req.schemaName).findOne({ where: { role: userRole } }, { transaction });

        if(!user) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });
        if(!role) return res.status(400).json({ success: false, code: 400, message: "Role not found!!!" });

        await user.schema(req.schemaName).removeRole(role, { transaction });

        await transaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Role Removed." });

    } catch (error) {
        console.log(error);
        if(transaction) await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { editRole, deleteRole, addRole, allRoles, assignRole, removeRole };