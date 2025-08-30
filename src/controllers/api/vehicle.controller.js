import Vehicle from "../../models/global/Vehicle.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


// GET request
const allVehicleList = asyncHandler(async (req, res) => {
    try {

        const { id = "", v_number = "" } = req.query;

        let whereClause = {};

        if (id) {
            whereClause.id = {
                [Op.eq]: id
            };
        }

        if (v_number) {
            whereClause.v_number = {
                [Op.like]: `%${v_number}%`
            };
        }

        const vehicleList = await Vehicle.findAll({
            where: Object.keys(whereClause).length ? whereClause : undefined
        });

        if (!vehicleList) return res.status(500).json({ success: false, code: 500, message: "Not Found!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully", data: vehicleList });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request
const addVehicle = asyncHandler(async (req, res) => {
    try {
        const { v_number = "", rc_no = "", ch_no = "", en_no = "", type = "" } = req.body;

        if (!v_number) return res.status(400).json({ succss: false, code: 400, message: "Vehicle number is required!!!" });

        const isVehicleExists = await Vehicle.findOne({ where: { number: v_number } });

        if (isVehicleExists) return res.status(409).json({ success: false, code: 409, message: `Vehicle no: ${v_number} already exists!!!` });

        const vehicle = await Vehicle.create({
            number: v_number,
            rc_no,
            chassis_no: ch_no,
            engine_no: en_no,
            type
        });

        if(!vehicle) return res.status(500).json({ success: false, code: 500, message: "Failed to add vehicle!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Vehicle added successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteVehicle = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if(!id) return res.status(400).json({ success: false, code: 400, message: "Vehicle id Required!!!" });

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
        if (rc_no) replace_object.rc_no = rc_no.trim();
        if (ch_no) replace_object.chassis_no = ch_no.trim();
        if (en_no) replace_object.engine_no = en_no.trim();
        if (type) replace_object.type = type.trim();

        const vehicle = await Vehicle.update(
            replace_object,
            { where: { number: v_number } }
        );

        if(!vehicle) return res.status(500).json({ success: false, code: 500, message: "Updation Failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Vehicle Details Updated." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allVehicleList, addVehicle, deleteVehicle, editVehicle };