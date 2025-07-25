import Role from "../../models/role.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import renderPage from "../../utils/renderPage.js";

// GET request

const roleView = async (req, res) => {
    const user = req.session.user;

    const allRole = await Role.findAll();
    const plainRole = allRole.map(role => role.get({ plain: true }));
    user.roles = plainRole;

    const data = await renderPage("./role/role", user) || "";

    return res.render("../layout", {
        head: `
            <link rel="stylesheet" href="/assets/css/dataTables/jquery.dataTables.min.css">
            <link rel="stylesheet" href="/assets/css/dataTables/buttons.dataTables.min.css">
            <link rel="stylesheet" href="/assets/css/modal.css">
        `,
        customeScript: `
            <script src="/assets/js/dataTables/jquery.dataTables.min.js"></script>
            <script src="/assets/js/dataTables/dataTables.buttons.min.js"></script>
            <script src="/assets/js/dataTables/jszip.min.js"></script>
            <script src="/assets/js/dataTables/pdfmake.min.js"></script>
            <script src="/assets/js/dataTables/vfs_fonts.js"></script>
            <script src="/assets/js/dataTables/buttons.html5.min.js"></script>
            <script src="/assets/js/dataTables/buttons.print.min.js"></script>
            <script>
                $(document).ready(function () {

                    $('#example').DataTable({
                    dom: 'Bfrtip',
                    buttons: [
                        {
                        extend: 'copy',
                        exportOptions: {
                            columns: [0, 1, 2] // include only these
                        }
                        },
                        {
                        extend: 'csv',
                        exportOptions: {
                            columns: [0, 1, 2]
                        }
                        },
                        {
                        extend: 'excel',
                        exportOptions: {
                            columns: [0, 1, 2]
                        }
                        },
                        {
                        extend: 'pdf',
                        exportOptions: {
                            columns: [0, 1, 2]
                        }
                        },
                        {
                        extend: 'print',
                        exportOptions: {
                            columns: [0, 1, 2]
                        }
                        }
                    ]
                    });
                });
            </script>
            <script src="/assets/js/modal.js"></script>
            <script type="module" src="/assets/js/customejs/role.js"></script>
        `,
        user,
        body: data,
        title: "Role"
    });
};

const editRoleView = asyncHandler(async (req, res) => {
    try {
        const { id } = req.query;

        const roleDetails = await Role.findByPk(id);

        if (!roleDetails) return res.status(400).json({ success: false, code: 400, message: "Record not found!!!" });

        const plainRoleDetails = roleDetails.get({ plain: true });

        return res.status(200).json({ success: true, code: 200, message: "", data: plainRoleDetails });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request

const deleteRole = asyncHandler(async (req, res) => {
    try {

        const id = req.query.id;

        await Role.destroy({ where: { id }});

        return res.status(200).json({ success: true, code: 200, message: "Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editRole = asyncHandler(async (req, res) => {
    try {
        const { id, newRole } = req.body;

        await Role.update(
            { role: newRole },
            { where: { id } }
        );

        return res.status(200).json({ success: true, code: 200, message: "Updation successfull." });


    } catch (error) {

        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const addRoleSubmit = asyncHandler(async (req, res) => {
    try {
        const { newRole } = req.body;

        const isExists = await Role.findOne({ where: { role: newRole } });

        if (isExists) return res.status(400).json({ success: false, code: 400, message: "Role already exists!!!" });

        await Role.create({ role: newRole });

        return res.status(200).json({ success: true, code: 200, message: "Role Added." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: false, code: 500, message: error.message });
    }
});

export { roleView, editRole, editRoleView, deleteRole, addRoleSubmit };