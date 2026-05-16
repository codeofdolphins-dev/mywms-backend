import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";


// GET
export const allRequisitionCategoryList = asyncHandler(async (req, res) => {
    const { RequisitionCategory } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", name = "", noLimt = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const list = await RequisitionCategory.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(name && { name: name?.trim }),
            },
            ...(!noLimt && { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        if (!list)
            return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = list.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: list.rows,
            ...(!noLimt && {
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            })
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createRequisitionCategory = asyncHandler(async (req, res) => {
    const { RequisitionCategory } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    // console.log(req.body); return

    try {
        const { name = "", desc = "" } = req.body;
        if (!name) throw new Error("Required fields are missing!!!");


        const isExiste = await RequisitionCategory.findOne({
            where: { name: { [Op.iLike]: name?.trim() } }
        });
        if (isExiste) throw new Error("Record already exists!!!");

        await RequisitionCategory.create({
            name: name?.trim(),
            desc: desc?.trim()
        }, { transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record Created." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// UPDATE
export const updateRequisitionCategory = asyncHandler(async (req, res) => {
    const { RequisitionCategory } = req.dbModels;
    try {
        const { id = "", name = "", desc = "", is_active = "" } = req.body;

        const requisitionCategory = await RequisitionCategory.findByPk(Number(id));
        if (!requisitionCategory) return res.status(404).json({ success: false, code: 404, message: "No record found!!!" });

        if (name) requisitionCategory.name = name?.trim();
        if (desc) requisitionCategory.desc = desc?.trim();
        if (is_active) requisitionCategory.is_active = Boolean(is_active);

        await requisitionCategory.save();

        return res.status(200).json({ success: true, code: 200, message: "Record Updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// DELETE
export const deleteRequisitionCategory = asyncHandler(async (req, res) => {
    const { RequisitionCategory } = req.dbModels;
    try {
        const { id } = req.params;
        if(!id) throw new Error("id must required!!!")

        const isDeleted = await RequisitionCategory.destroy({
            where: { id: parseInt(id, 10) },
        });
        if (!isDeleted) return res.status(503).json({ success: false, code: 503, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});