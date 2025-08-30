import renderPage from "../../utils/renderPage.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Permission from "../../models/global/Permission.model.js"

// GET request
const permissionView = asyncHandler(async (req, res) => {
    const user = req.session.user;

    const permissions = await Permission.findAll();
    const plainPermission = permissions.map(permission => permission.get({ plain: true }));

    const data = await renderPage("permission", plainPermission) || "";

    return res.render("../layout", {
        head: `
            <link rel="stylesheet" href="/assets/css/modal.css">
            <link rel="stylesheet" href="/assets/css/customeCss/permission.css">
        `,
        customeScript: `            
            <script src="/assets/js/modal.js"></script>
            <script type="module" src="/assets/js/customejs/permission.js"></script>
        `,
        user,
        body: data,
        title: "Permission"
    });
});

const editPermissionView = asyncHandler(async (req, res) => {
    try {
        const { id } = req.query;

        const permissionDetails = await Permission.findByPk(id);

        if (!permissionDetails) return res.status(400).json({ success: false, code: 400, message: "Record not found!!!" });

        const plainPermissionDetails = permissionDetails.get({ plain: true });

        return res.status(200).json({ success: true, code: 200, message: "", data: plainPermissionDetails });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request
const addPermission = asyncHandler(async (req, res) => {
    try {
        const { module, permissionType } = req.body;

        const permission = await Permission.create({
            permission: `${module}:${permissionType}`
        });

        if (!permission) return res.status(500).json({ success: false, code: 500, message: "Permission Not Created!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Added Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deletePermission = asyncHandler(async (req, res) => {
    try {

        const id = req.query.id;

        await Permission.destroy({ where: { id } });

        return res.status(200).json({ success: true, code: 200, message: "Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editPermission = asyncHandler(async (req, res) => {
    try {
        const { id, module, permissionType } = req.body;

        await Permission.update(
            { permission: `${module}:${permissionType}` },
            { where: { id } }
        );

        return res.status(200).json({ success: true, code: 200, message: "Updation successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { permissionView, editPermissionView, addPermission, deletePermission, editPermission };