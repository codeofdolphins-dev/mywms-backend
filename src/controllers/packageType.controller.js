import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const allPackageType = asyncHandler(async (req, res) => {
    const { PackageType } = req.dbModels

    try {
        let { page = 1, limit = 10, name = "", id = "", noLimt = false } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const packageRecord = await PackageType.findAndCountAll({
            where: (name || id) ? {
                [Op.or]: [
                    {
                        id: parseInt(id) || null
                    },
                    {
                        name: {
                            [Op.iLike]: `${name}%`
                        }
                    }
                ]
            } : undefined,
            ...(noLimt ? {} : { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        if (!packageRecord) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = packageRecord.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: packageRecord.rows,
            ...(!noLimt && {
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            }),
        });
    } catch (error) {
        console.log(error);
        return res.success(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const createPackageType = asyncHandler(async (req, res) => {
    const { PackageType } = req.dbModels
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, code: 400, message: "Name required!!!" });

        const isExists = await PackageType.findOne({ where: { name: { [Op.iLike]: name } } });
        if (isExists) return res.status(409).json({ success: false, code: 409, message: "Record already exists!!!" });

        const isCreated = await PackageType.create({ name });
        if (!isCreated) return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Created Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// UPDATE
const updatePackageType = asyncHandler(async (req, res) => {
    const { PackageType } = req.dbModels
    try {

        const { id, name, isActive } = req.body;

        const packageRecord = await PackageType.findByPk(parseInt(id, 10));
        if (!unitRecord) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        if (name) packageRecord.unit = name;
        if (isActive) packageRecord.isActive = isActive;

        const isUpdate = await packageRecord.save();
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Record updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deletePackageType = asyncHandler(async (req, res) => {
    const { PackageType } = req.dbModels
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "id must required!!!" });

        const isExists = await PackageType.findOne({ where: { id: parseInt(id, 10) } });
        if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        const isDeleted = await PackageType.destroy({ where: { id: parseInt(id, 10) } })
        if (!isDeleted) return res.status(500).json({ success: false, code: 500, message: "Record not deleted!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { allPackageType, createPackageType, updatePackageType, deletePackageType };