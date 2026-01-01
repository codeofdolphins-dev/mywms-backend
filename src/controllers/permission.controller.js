import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET request
const allPermissions = asyncHandler(async (req, res) => {
    const { Permission } = req.dbModels;

    try {

        let { limit = 10, page = 1, text = "" } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const permissions = await Permission.findAndCountAll({
            where: text ? {
                permission: {
                    [Op.iLike]: `${text}%`
                }
            } : undefined,
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });

        const totalItems = permissions.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "All Permissions fetched successfully",
            data: permissions.rows,
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

// POST request
const addPermission = asyncHandler(async (req, res) => {

    const { Permission } = req.dbModels;

    try {
        const { module, permissionType } = req.body;

        if (!module && !permissionType) return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });

        const isExists = await Permission.findOne({ where: { permission: `${module.toLowerCase().trim()}:${permissionType.toLowerCase().trim()}` } })

        if (isExists) return res.status(400).json({ success: false, code: 400, message: "Permission already exists!!!" });

        const permission = await Permission.create({
            permission: `${module.toLowerCase().trim()}:${permissionType.toLowerCase().trim()}`
        });

        if (!permission) return res.status(500).json({ success: false, code: 500, message: "Permission Not Created!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Permission Added Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deletePermission = asyncHandler(async (req, res) => {

    const { Permission } = req.dbModels;

    try {

        const id = req.params.id;

        const isDeleted = await Permission.destroy({ where: { id } });

        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Permission Not Deleted." });

        return res.status(200).json({ success: true, code: 200, message: "Permission Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const editPermission = asyncHandler(async (req, res) => {

    const { Permission } = req.dbModels;

    try {
        const { id, module, permissionType } = req.body;

        const isUpdate = await Permission.update(
            { permission: `${module.toLowerCase().trim()}:${permissionType.toLowerCase().trim()}` },
            { where: { id } }
        );

        if (!isUpdate) return res.status(400).json({ success: false, code: 400, message: "Updation Failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updation successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { allPermissions, addPermission, deletePermission, editPermission };