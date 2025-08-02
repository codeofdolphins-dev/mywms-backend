import renderPage from "../../utils/renderPage.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Permission from "../../models/permission.model.js";
import RolePermission from "../../models/rolePermissions.joinModel.js";

// GET request
const assignPermissionView = asyncHandler(async (req, res) => {
    const user = req.session.user;
    const { roleId } = req.params;

    // Get all permissions
    const allPermissions = await Permission.findAll();

    // Group by section
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

    // Also, get role's permissions (for toggles)
    const rolePermissions = await RolePermission.findAll({
        where: { roleId }
    });
    const rolePermissionIds = rolePermissions.map(rp => rp.permissionId);

    console.log("rolePermission", rolePermissionIds);

    const data = await renderPage("managePermission", { groupedPermissions: grouped, rolePermissionIds, roleId });

    // Send to EJS
    return res.render("../layout", {
        head: `
            <link href="/assets/css/lib/bootstrap5.min.css" rel="stylesheet">
            <link href="/assets/css/customeCss/managePermission.css" rel="stylesheet">
        `,
        customeScript: `
            <script type="module" src="/assets/js/customejs/managePermission.js"></script>
        `,
        user,
        body: data,
        title: "Manage Permission"
    });
});

// POST request
const assignPermissions = asyncHandler(async (req, res) => {

    // console.log(req.body);    
    // return;

    try {
        const roleId = req.body.roleId;
        const permissionIds = Array.isArray(req.body.permissions)
            ? req.body.permissions
            : [req.body.permissions]; // handles single checkbox too        

        // Remove old permissions for this role
        await RolePermission.destroy({
            where: { roleId: roleId }
        });

        // Prepare new mappings
        const newMappings = permissionIds.map(pid => ({
            roleId: roleId,
            permissionId: pid
        }));       

        // Insert new mappings
        await RolePermission.bulkCreate(newMappings);

       return res.status(200).json({ success: true, code: 200, message: "Permissions assigned." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// const addPermission = asyncHandler( async (req, res) => {});

export { assignPermissionView, assignPermissions };