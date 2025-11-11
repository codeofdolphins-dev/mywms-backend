import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const allUnit = asyncHandler(async (req, res) => {
    const { Unit } = req.dbModels

    try {
        let { page = 1, limit = 10, name = "", id = "" } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const unitRecord = await Unit.findAndCountAll({
            where: (name || id) ? {
                [Op.or]: [
                    {
                        id: parseInt(id) || null
                    },
                    {
                        unit: {
                            [Op.iLike]: `%${name}%`
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
        const { name } = req.body;

        const isExists = await Unit.findOne({ where: { unit: name } });
        if (isExists) return res.status(409).json({ success: false, code: 409, message: "Record already exists!!!" });

        const isCreated = await Unit.create({ unit: name });
        if (!isCreated) return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record Created Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// UPDATE
const updateUnit = asyncHandler(async (req, res) => {
    const { Unit } = req.dbModels
    try {

        const { id, name } = req.body;        
        
        const unitRecord = await Unit.findByPk(parseInt(id, 10));
        if (!unitRecord) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        
        unitRecord.unit = name;
        const isUpdate = await unitRecord.save();
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Record updation failed!!!" });
        
        return res.status(200).json({ success: true, code: 200, message: "Record Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteUnit = asyncHandler(async (req, res) => {
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


export { allUnit, createUnit, deleteUnit, updateUnit };