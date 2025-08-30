import { asyncHandler } from "../../utils/asyncHandler.js";
import Permission from "../../models/global/Permission.model.js";
import RolePermission from "../../models/RolePermissions.joinModel.js";

// GET request
const allAssignPermissions = asyncHandler(async (req, res) => {
    try {
        const { roleId } = req.params;

        if (!roleId) return res.status(500).json({ success: false, code: 500, message: "Role id Required." });

        const allPermissions = await Permission.findAll();

        const grouped = {};

        allPermissions.forEach(p => {
            const [section, action] = p.permission.split(':');
            if (!grouped[section]) grouped[section] = [];
            grouped[section].push({
                id: p.id,
                action,
                full: p.permission
            });
        });

        const rolePermissions = await RolePermission.findAll({
            where: { roleId }
        });
        const rolePermissionIds = rolePermissions.map(rp => rp.permissionId);

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: { allPermissions: grouped, allowed: rolePermissionIds } });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });

    }
});

// POST request
const assignPermissions = asyncHandler(async (req, res) => {
    try {
        const { roleId, assignedPermissionIds } = req.body;

        if (!roleId && Array.isArray(assignedPermissionIds)) return res.status(500).json({ success: false, code: 500, message: "Invalid payload!!!" });

        // Remove old permissions for this role
        await RolePermission.destroy({
            where: { roleId }
        });

        // Prepare new mappings
        const newMappings = assignedPermissionIds.map(pid => ({
            roleId: roleId,
            permissionId: pid
        }));

        await RolePermission.bulkCreate(newMappings);

        return res.status(200).json({ success: true, code: 200, message: "Permissions assigned." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allAssignPermissions, assignPermissions };