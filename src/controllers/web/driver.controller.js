import { Op } from "sequelize";
import Driver from "../../models/Driver.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import renderPage from "../../utils/renderPage.js";


// API
const driverListAPI = asyncHandler(async (req, res) => {
    try {
        const { id = "", license_no = "" } = req.query;

        let whereClause = {};

        if (id) {
            whereClause.id = {
                [Op.eq]: id
            };
        }

        if (license_no) {
            whereClause.license_no = {
                [Op.like]: `%${license_no}%`
            };
        }

        const driverList = await Driver.findAll({
            where: Object.keys(whereClause).length ? whereClause : undefined
        });

        if(!driverList) return res.status(500).json({ success: false, code: 500, message: "Fatching errro!!!" });

        return res.status(200).json({ success: true, code: 200, data: driverList });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// GET request
const driverList = async (req, res) => {
    const user = req.session.user;

    const driverList = await Driver.findAll({});

    const plainDriverList = driverList.map(vehicle => vehicle.get({ plain: true }));

    const data = await renderPage("./driver/driver", plainDriverList) || "";

    return res.render("../layout", {
        head: `
            <link rel="stylesheet" href="/assets/css/dataTables/jquery.dataTables.min.css">
            <link rel="stylesheet" href="/assets/css/dataTables/buttons.dataTables.min.css">
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
                            columns: [0, 1, 2, 3, 4]
                        }
                        },
                        {
                        extend: 'csv',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4]
                        }
                        },
                        {
                        extend: 'excel',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4]
                        }
                        },
                        {
                        extend: 'pdf',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4]
                        }
                        },
                        {
                        extend: 'print',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4]
                        }
                        }
                    ]
                    });
                });
            </script>
            <script src="/assets/js/sweetalert2@11.js"></script>
            <script type="module" src="/assets/js/customejs/driver/driver.js"></script>
        `,
        user,
        body: data,
        title: "Driver List"
    });
}

const addDriverForm = async (req, res) => {
    const user = req.session.user;

    const data = await renderPage("./driver/addDriver") || "";

    return res.render("../layout", {
        head: `
            <link rel="stylesheet" href="/assets/css/lib/bootstrap-icons.css">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
            <link rel="stylesheet" href="/assets/css/customeCss/addVehicle.css">            
        `,
        customeScript: `
            <script src="/assets/js/sweetalert2@11.js"></script>
            <script type="module" src="/assets/js/customeJS/driver/addDriver.js"></script>`,
        user,
        body: data,
        title: "Add Driver"
    });
}

const editDriverForm = asyncHandler(async (req, res) => {
    try {
        const user = req.session.user;

        const { id } = req.query;

        const driverDetails = await Driver.findByPk(id);
        const plainDriverDetails = driverDetails.get({ plain: true });

        const data = await renderPage("./driver/addDriver", plainDriverDetails) || "";

        return res.render("../layout", {
            head: `
            <link rel="stylesheet" href="/assets/css/customeCss/addDriver.css">
            `,
            customeScript: `
            <script src="/assets/js/sweetalert2@11.js"></script>
            `,
            user,
            body: data,
            title: "Edit Driver Details"
        });

    } catch (error) {
        console.log(error);
    }
});


// POST request
const addDriverSubmit = asyncHandler(async (req, res) => {
    try {
        const { name = "", license_no = "", contact_no = "", address = "" } = req.body;

        if (!license_no) return res.status(400).json({ succss: false, code: 400, message: "License number is required!!!" });

        const isDriverExists = await Driver.findOne({ where: { license_no } });

        if (isDriverExists) return res.status(409).json({ success: false, code: 409, message: `License no: ${license_no} already exists!!!` });

        await Driver.create({
            name,
            license_no,
            contact_no,
            address
        });

        return res.status(200).json({ success: true, code: 200, message: "Driver Added." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteDriver = asyncHandler(async (req, res) => {
    try {
        const { id } = req.query;

        await Driver.destroy({ where: { id } });

        return res.status(200).json({ success: true, code: 200, message: "Record Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editDriver = asyncHandler(async (req, res) => {
    try {

        const { name = "", license_no = "", contact_no = "", address = "" } = req.body;

        if (!license_no) return res.status(400).json({ succss: false, code: 400, message: "Vehicle number is required!!!" });

        const isDriverExists = await Driver.findOne({ where: { license_no } });

        // if (!isDriverExists) return res.status(409).json({ success: false, code: 409, message: `Driver with that license number is not exists!!!` });
        if (!isDriverExists) return res.redirect(`/driver?message="Not Found!!!"`);

        let replace_object = {}
        if (name) replace_object.name = name.trim();
        if (contact_no) replace_object.contact_no = contact_no.trim();
        if (address) replace_object.address = address.trim();

        await Driver.update(
            replace_object,
            { where: { license_no } }
        );

        return res.redirect("/driver");

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { driverList, addDriverForm, editDriverForm, addDriverSubmit, deleteDriver, editDriver, driverListAPI }