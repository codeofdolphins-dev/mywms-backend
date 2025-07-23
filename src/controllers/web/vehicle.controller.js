import Vehicle from "../../models/vehicle.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import renderPage from "../../utils/renderPage.js";

// GET request
const vehicleList = async (req, res) => {
    const user = req.session.user;

    // if (!user) res.redirect("/auth/login");

    const vehicleList = await Vehicle.findAll({});

    const plainVehicleList = vehicleList.map(vehicle => vehicle.get({ plain: true }));

    const data = await renderPage("vehicle", plainVehicleList) || "";

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
                            columns: [0, 1, 2, 3, 4, 5] // include only these
                        }
                        },
                        {
                        extend: 'csv',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5]
                        }
                        },
                        {
                        extend: 'excel',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5]
                        }
                        },
                        {
                        extend: 'pdf',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5]
                        }
                        },
                        {
                        extend: 'print',
                        exportOptions: {
                            columns: [0, 1, 2, 3, 4, 5]
                        }
                        }
                    ]
                    });
                });
            </script>
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
            <script type="module" src="/assets/js/customejs/vehicle.js"></script>
        `,
        user,
        body: data,
        title: "Velicle List"
    });
}

const addVehicleForm = async (req, res) => {
    const user = req.session.user;

    // if (!user) res.redirect("/auth/login");

    const data = await renderPage("addVehicle") || "";

    return res.render("../layout", {
        head: ``,
        customeScript: `
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
            <script type="module" src="/assets/js/customejs/addVehicle.js"></script>`,
        user,
        body: data,
        title: "Add Vehicle"
    });
}

const editVehicleForm = asyncHandler(async (req, res) => {
    try {
        const user = req.session.user;

        const { id } = req.query;

        const vehicleDetails = await Vehicle.findByPk(id);
        const plainVehicleDetails = vehicleDetails.get({ plain: true });

        const data = await renderPage("addVehicle", plainVehicleDetails) || "";

        return res.render("../layout", {
            head: ``,
            customeScript: `
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
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
const addVehicleSubmit = asyncHandler(async (req, res) => {
    try {
        const { v_number = "", rc_no = "", ch_no = "", en_no = "", type = "" } = req.body;

        if (!v_number) return res.status(400).json({ succss: false, code: 400, message: "Vehicle number is required!!!" });

        const isVehicleExists = await Vehicle.findOne({ where: { number: v_number } });

        if (isVehicleExists) return res.status(409).json({ success: false, code: 409, message: `Vehicle no: ${v_number} already exists!!!` });

        await Vehicle.create({
            number: v_number,
            rc_no,
            chassis_no: ch_no,
            engine_no: en_no,
            type
        });

        return res.status(200).json({ success: true, code: 200, message: "Vehicle Added" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteVehicle = asyncHandler(async (req, res) => {
    try {
        const { id } = req.query;

        await Vehicle.destroy({ where: { id } });

        return res.status(200).json({ success: true, code: 200, message: "Record Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editVehicle = asyncHandler(async (req, res) => {
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

export { vehicleList, addVehicleForm, addVehicleSubmit, deleteVehicle, editVehicle, editVehicleForm }