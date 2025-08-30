import { Op } from "sequelize";
import Driver from "../../models/global/Driver.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


// GET request
const driverList = asyncHandler(async (req, res) => {
    try {
        const { id = "", license_no = "" } = req.query;

        let whereClause = {};

        if (id) {
            whereClause.id = {
                [Op.eq]: id
            };
        };

        if (license_no) {
            whereClause.license_no = {
                [Op.like]: `%${license_no}%`
            };
        };

        const driverList = await Driver.findAll({
            where: Object.keys(whereClause).length ? whereClause : undefined
        });

        if (!driverList) return res.status(500).json({ success: false, code: 500, message: "Fatching errro!!!" });

        return res.status(200).json({ success: true, code: 200, data: driverList });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteDriver = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, code: 400, message: "Driver id required!!!" });

        await Driver.destroy({ where: { id } });

        return res.status(200).json({ success: true, code: 200, message: "Record Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST request
const addDriver = asyncHandler(async (req, res) => {
    try {
        const { name = "", license_no = "", contact_no = "", address = "" } = req.body;

        if (!license_no) return res.status(400).json({ succss: false, code: 400, message: "License number is required!!!" });

        const isDriverExists = await Driver.findOne({ where: { license_no } });

        if (isDriverExists) return res.status(409).json({ success: false, code: 409, message: `Driver with License no: ${license_no} already exists!!!` });

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

const editDriver = asyncHandler(async (req, res) => {
    try {
        const { name = "", license_no = "", contact_no = "", address = "" } = req.body;

        if (!license_no) return res.status(400).json({ succss: false, code: 400, message: "License number is required!!!" });

        const isDriverExists = await Driver.findOne({ where: { license_no } });

        if (!isDriverExists) return res.status(409).json({ success: false, code: 409, message: `Driver with license number ${license_no} is not exists!!!` });

        let replace_object = {}
        if (name) replace_object.name = name.trim();
        if (contact_no) replace_object.contact_no = contact_no.trim();
        if (address) replace_object.address = address.trim();

        await Driver.update(
            replace_object,
            { where: { license_no } }
        );

        return res.status(200).json({ success: true, code: 200, message: "Details updated." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { addDriver, deleteDriver, editDriver, driverList }