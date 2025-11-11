import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rootDB } from "../db/tenantMenager.service.js";
const { models } = await rootDB();
const { Driver } = models;


// GET request
const allDriverList = asyncHandler(async (req, res) => {
    try {
        let { page = 1, limit = 10, license_no = null, id = null, name = null } = req.query;

        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const driverList = await Driver.findAndCountAll({
            where: (license_no || id || name) ? {
                [Op.or]: [
                    {
                        id: parseInt(id) || null
                    },
                    {
                        license_no: {
                            [Op.like]: `${license_no}%`
                        }
                    },
                    {
                        name: {
                            [Op.iLike]: `%${name}%`
                        }
                    }
                ]
            } : undefined,
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!driverList) return res.status(500).json({ success: false, code: 500, message: "Not Found!!!" });

        const totalItems = driverList.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: driverList.rows,
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

const myDriverList = asyncHandler(async (req, res) => {
    try {
        const dbName = req.headers["x-tenant-id"];

        let { page = 1, limit = 10, license_no = null, id = null, name = null } = req.query;

        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const driverList = await Driver.findAndCountAll({
            where: {
                owned_by: dbName,
                ...(license_no || id ? {
                    [Op.or]: [
                        ...(id ? [{ id: parseInt(id, 10) }] : []),
                        ...(
                            license_no ?
                                [{ license_no: { [Op.like]: `${license_no}%` } }]
                                : []
                        ),
                        ...(
                            name ?
                                [{ name: { [Op.iLike]: `%${name}%` } }]
                                : []
                        ),
                    ]
                } : undefined)
            },
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!driverList) return res.status(500).json({ success: false, code: 500, message: "Not Found!!!" });

        const totalItems = driverList.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: driverList.rows,
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

const deleteDriver = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Driver id required!!!" });

        const dbName = req.headers["x-tenant-id"];

        const isDeleted = await Driver.destroy({ where: { id, owned_by: dbName } });
        if (!isDeleted) return res.status(403).json({ success: false, code: 403, message: "Not Possible!!!" });

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

        const dbName = req.headers["x-tenant-id"];

        const isDriverExists = await Driver.findOne({ where: { license_no, owned_by: dbName } });
        if (isDriverExists) return res.status(409).json({ success: false, code: 409, message: `Driver with License no: ${license_no} already exists!!!` });

        const driver = await Driver.create({
            name,
            license_no,
            contact_no,
            address,
            owned_by: dbName
        });
        if (!driver) return res.status(500).json({ success: false, code: 500, message: "Failed to add driver!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Driver added successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editDriver = asyncHandler(async (req, res) => {
    try {
        const { name = "", license_no = "", contact_no = "", address = "" } = req.body;
        if (!license_no) return res.status(400).json({ succss: false, code: 400, message: "License number is required!!!" });

        const dbName = req.headers["x-tenant-id"];
        if (!dbName) return res.status(400).json({ succss: false, code: 400, message: "'x-tenant-id' header required!!!" });

        const isDriverExists = await Driver.findOne({ where: { license_no } });
        if (!isDriverExists) return res.status(409).json({ success: false, code: 409, message: `Driver with license number ${license_no} is not exists!!!` });

        let replace_object = {}
        if (name) replace_object.name = name.trim();
        if (contact_no) replace_object.contact_no = contact_no.trim();
        if (address) replace_object.address = address.trim();

        const isUpdate = await Driver.update(
            replace_object,
            { where: { license_no, owned_by: dbName } }
        );
        if (!isUpdate) return res.status(403).json({ success: false, code: 403, message: "Updation not possible!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Details updated." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { addDriver, deleteDriver, editDriver, allDriverList, myDriverList };