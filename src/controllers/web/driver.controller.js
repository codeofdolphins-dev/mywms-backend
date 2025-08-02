import Driver from "../../models/driver.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import renderPage from "../../utils/renderPage.js";

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

        const vehicleDetails = await Vehicle.findByPk(id);
        const plainVehicleDetails = vehicleDetails.get({ plain: true });

        const data = await renderPage("./vehicle/addVehicle", plainVehicleDetails) || "";

        return res.render("../layout", {
            head: `
            <link rel="stylesheet" href="/assets/css/customeCss/addVehicle.css">            
            `,
            customeScript: `
            <script src="/assets/js/sweetalert2@11.js"></script>
            <script type="module" src="/assets/js/customejs/editVehicle.js"></script>`,
            user,
            body: data,
            title: "Edit Vehicle"
        });

    } catch (error) {
        console.log(error);
    }
});


// POST request
const addDriverSubmit = asyncHandler(async (req, res) => {
    try {
        const { name = "", license_no = "", contact_no = "", address = "" } = req.body;

        if (!v_number) return res.status(400).json({ succss: false, code: 400, message: "Vehicle number is required!!!" });

        const isVehicleExists = await Driver.findOne({ where: { license_no } });

        if (isVehicleExists) return res.status(409).json({ success: false, code: 409, message: `Vehicle no: ${v_number} already exists!!!` });

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

        await Vehicle.destroy({ where: { id } });

        return res.status(200).json({ success: true, code: 200, message: "Record Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editDriver = asyncHandler(async (req, res) => {
    try {
        const { v_number = "", rc_no = "", ch_no = "", en_no = "", type = "" } = req.body;

        if (!v_number) return res.status(400).json({ succss: false, code: 400, message: "Vehicle number is required!!!" });

        const isVehicleExists = await Vehicle.findOne({ where: { number: v_number } });

        if (!isVehicleExists) return res.status(409).json({ success: false, code: 409, message: `Vehicle not found!!!` });

        let replace_object = {}
        if(rc_no) replace_object.rc_no = rc_no.trim();
        if(ch_no) replace_object.chassis_no = ch_no.trim();
        if(en_no) replace_object.engine_no = en_no.trim();
        if(type) replace_object.type = type.trim();

        await Vehicle.update(
            replace_object,
            { where: { number: v_number } }
        );

        return res.redirect("/vehicle");

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { driverList, addDriverForm, editDriverForm, addDriverSubmit, deleteDriver, editDriver }