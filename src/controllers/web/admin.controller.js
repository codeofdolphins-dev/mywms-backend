import { asyncHandler } from "../../utils/asyncHandler.js";
import renderPage from "../../utils/renderPage.js";
import Role from "../../models/role.model.js";


// GET request
const adminDashboard = async (req, res) => {
    const user = req.session.user;

    // if (!user) res.redirect("/auth/login");

    const data = await renderPage("adminRegister", user) || "";

    return res.render("../layout", {
        head: `<link href="assets/css/lib/jsgrid/jsgrid-theme.min.css" rel="stylesheet" />
                <link href="assets/css/lib/jsgrid/jsgrid.min.css" type="text/css" rel="stylesheet" />`,
        user,
        body: data,
        title: "Dashboard"
    });
}

const role = asyncHandler(async (req, res) => {
    const userdata = req.session.user;
    if (!userdata) res.redirect("/auth/login");

    const allRole = await Role.findAll();

    userdata.allRole = allRole;

    const data = await renderPage("role", userdata);

    return res.render("../layout", {
        head: `
            <link rel="stylesheet" href="/assets/css/dataTables/jquery.dataTables.min.css">
            <link rel="stylesheet" href="/assets/css/dataTables/buttons.dataTables.min.css">
            <link rel="stylesheet" href="/assets/css/customeCss/role.css">
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
            <script type="module" src="/assets/js/customejs/role.js"></script>
        `,
        user: userdata,
        body: data,
        title: "Role",
        allRole
    });
});

const permission = async (req, res) => {
    const user = req.session.user;
    if (!user) res.redirect("/auth/login");

    const data = await renderPage("adminRegister", user) || "";

    res.render("../layout", {
        head: `<link href="assets/css/lib/jsgrid/jsgrid-theme.min.css" rel="stylesheet" />
    <link href="assets/css/lib/jsgrid/jsgrid.min.css" type="text/css" rel="stylesheet" />`,
        user,
        body: data,
        title: "Dashboard"
    });
}


// POST request

const sample = asyncHandler(async (req, res) => { });

export { adminDashboard, role, permission };