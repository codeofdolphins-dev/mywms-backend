import { Op } from "sequelize";
import asyncHandler from "../utils/asyncHandler.js";

// GET
const AllUnit = asyncHandler(async (req, res) => {
    const { Unit } = req.dbModels

    try {
        let { page = 1, limit = 10, unit = "", id = "" } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const unitRecord = await Unit.findAndCountAll({
            where: (unit || id) ? {
                [Op.or]: [
                    {
                        id: parseInt(id) || null
                    },
                    {
                        unit: {
                            [Op.iLike]: `${unit}%`
                        }
                    }
                ]
            } : undefined,
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!unitRecord) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = unitRecord.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: unitRecord.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.log(error);
        return res.success(500).json({ success: false, code: 500, message: error.message });
    }
});
// POST
const createUnit = asyncHandler(async (req, res) => {
    const { Unit } = req.dbModels
    try {
        const { unit } = res.body;

        const isExists = await Unit.findOne({ where: { unit } });
        if (isExists) return res.status(409).json({ success: false, code: 409, message: "Record already exists!!!" });

        const isCreated = await Unit.create({ unit });
        if (!isCreated) return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Created Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});
// UPDATE
const UpdateUnit = asyncHandler(async (req, res) => {
    const { Unit } = req.dbModels
    try {

        const { unit } = req.body;

        const unitRecord = await Unit.findOne({ where: { unit } });
        if (!unitRecord) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        unitRecord.unit = unit;
        const [isUpdate] = await unitRecord.save();
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Record updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});
// DELETE
const DeleteUnit = asyncHandler(async (req, res) => {
    const { Unit } = req.dbModels
    try {

        const { id } = req.params;

        const isExists = await Unit.findOne({ where: { id } });
        if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        const isDeleted = await Unit.destroy({ where: { id } })
        if (!isDeleted) return res.status(500).json({ success: false, code: 500, message: "Record not deleted!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Deleted." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { AllUnit, createUnit, DeleteUnit, UpdateUnit };