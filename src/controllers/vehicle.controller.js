import { Op } from "sequelize";
import { rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const { models } = await rootDB();
const { Vehicle } = models;


// GET request
const allVehicleList = asyncHandler(async (req, res) => {
    try {
        let { page = 1, limit = 10, v_number = "", id = "" } = req.query;

        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const vehicleList = await Vehicle.findAndCountAll({
            where: (v_number || id) ? {
                [Op.or]: [
                    {
                        id: parseInt(id) || null
                    },
                    {
                        number: {
                            [Op.iLike]: `%${v_number}%`
                        }
                    }
                ]
            } : undefined,
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!vehicleList) return res.status(500).json({ success: false, code: 500, message: "Not Found!!!" });

        const totalItems = vehicleList.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: vehicleList.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const myVehicleList = asyncHandler(async (req, res) => {
    try {
        const dbName = req.headers["x-tenant-id"];

        let { page = 1, limit = 10, v_number = "", id = "" } = req.query;

        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const vehicleList = await Vehicle.findAndCountAll({
            where: {
                owned_by: dbName,
                ...(v_number || id ? {
                    [Op.or]: [
                        ...(id ? [{ id: parseInt(id, 10) }] : []),
                        ...(v_number ? [{ v_number }] : []),
                    ]
                } : undefined)
            },
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!vehicleList) return res.status(500).json({ success: false, code: 500, message: "Not Found!!!" });

        const totalItems = vehicleList.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: vehicleList.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteVehicle = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Vehicle id Required!!!" });

        const dbName = req.headers["x-tenant-id"];

        const isDelete = await Vehicle.destroy({ where: { id, owned_by: dbName } });
        if (!isDelete) return res.status(403).json({ success: false, code: 403, message: "Not Possible!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Deleted." });

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

        const dbName = req.headers["x-tenant-id"];

        const isVehicleExists = await Vehicle.findOne({ where: { number: v_number, owned_by: dbName } });
        if (isVehicleExists) return res.status(409).json({ success: false, code: 409, message: `Vehicle no: ${v_number} already exists!!!` });

        const vehicle = await Vehicle.create({
            number: v_number,
            rc_no,
            chassis_no: ch_no,
            engine_no: en_no,
            type,
            owned_by: dbName
        });
        if (!vehicle) return res.status(500).json({ success: false, code: 500, message: "Failed to add vehicle!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Vehicle added successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editVehicle = asyncHandler(async (req, res) => {
    try {
        const { v_number = "", rc_no = "", ch_no = "", en_no = "", type = "" } = req.body;
        if (!v_number) return res.status(400).json({ succss: false, code: 400, message: "Vehicle number is required!!!" });

        const dbName = req.headers["x-tenant-id"];
        if (!dbName) return res.status(400).json({ succss: false, code: 400, message: "'x-tenant-id' header required!!!" });

        const isVehicleExists = await Vehicle.findOne({ where: { number: v_number, owned_by: dbName } });
        if (!isVehicleExists) return res.status(409).json({ success: false, code: 409, message: `Vehicle not found Or Not Possible!!!` });

        let replace_object = {}
        if (rc_no) replace_object.rc_no = rc_no.trim();
        if (ch_no) replace_object.chassis_no = ch_no.trim();
        if (en_no) replace_object.engine_no = en_no.trim();
        if (type) replace_object.type = type.trim();

        const vehicle = await Vehicle.update(
            replace_object,
            { where: { number: v_number } }
        );

        if (!vehicle) return res.status(500).json({ success: false, code: 500, message: "Updation Failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Vehicle Details Updated." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allVehicleList, myVehicleList, addVehicle, deleteVehicle, editVehicle };