import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const allHSNList = asyncHandler(async (req, res) => {
    const { HSN } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", search = "", rate = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const hsn = await HSN.findAndCountAll({
            where: (id || search || rate) ? {
                [Op.or]: [
                    ...(id && Number.isInteger(Number(id))
                        ? [{ id: Number(id) }]
                        : []),
                    ...(search
                        ? [{
                            hsn_code: {
                                [Op.iLike]: `${search}%`
                            }
                        }]
                        : []),
                    ...(rate
                        ? [{ rate }]
                        : [])
                ]
            } : undefined,
            ...(noLimit ? {} : { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        if (!hsn) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = hsn.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: hsn.rows,
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

// POST
const createHSN = asyncHandler(async (req, res) => {
    const { HSN } = req.dbModels;
    try {
        const { code = "", rate = "" } = req.body;

        if (!code || !rate) return res.status(400).json({ success: false, code: 400, message: "Both fields are  required!!!" });

        const is_exists = await HSN.findOne({ where: { hsn_code: code } });
        if (is_exists) return res.status(409).json({ success: false, code: 409, message: `HSN code: ${code} already exists!!!` });

        const hsn = await HSN.create({
            hsn_code: code,
            rate
        });
        if (!hsn) return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "HSN added." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteHSN = asyncHandler(async (req, res) => {
    const { HSN } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await HSN.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateHSN = asyncHandler(async (req, res) => {
    const { HSN } = req.dbModels;
    try {
        const { id = "", code = "", rate = "", status = "" } = req.body;
        if (!id && !code) return res.status(400).json({ success: false, code: 400, message: "Either Id or hsn_code  required!!!" });

        let updateDetails = {};
        if (rate) updateDetails.rate = rate;
        if (status) updateDetails.status = status;

        const isUpdate = await HSN.update(
            updateDetails,
            { where: { [Op.or]: [{ id: parseInt(id) || null }, { hsn_code: parseInt(code) || null }] } }
        );
        if (!isUpdate) return res.status(400).json({ success: false, code: 400, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allHSNList, createHSN, deleteHSN, updateHSN };