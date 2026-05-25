import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
export const costCategoryList = asyncHandler(async (req, res) => {
    const { CostCategory } = req.dbModels;
    const activeNodeId = req.activeNode;
    try {
        let { page = 1, limit = 10, id = null, name = null, noLimit = false, isAdmin = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const costCategory = await CostCategory.findAndCountAll({
            where: {
                // location_id: activeNodeId,
                ...(id || name ? {
                    [Op.or]: [
                        ...(id ? [{ id: parseInt(id, 10) }] : []),
                        ...(
                            name ?
                                [{ name: { [Op.iLike]: `%${name}%` } }]
                                : []
                        )
                    ]
                } : { parent_id: null }),
                ...(!isAdmin && { location_id: activeNodeId })
            },
            include: {
                model: CostCategory,
                as: 'subCostCategories',
                include: {
                    model: CostCategory,
                    as: 'subCostCategories'
                }
            },
            ...(noLimit ? {} : { limit, offset }),
            order: [['createdAt', 'ASC']]
        });
        if (!costCategory) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = costCategory.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: costCategory.rows,
            ...(noLimit
                ? {}
                : {
                    pagination: {
                        totalItems,
                        totalPages,
                        currentPage: page,
                        limit
                    }
                }
            ),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
export const createCostCategory = asyncHandler(async (req, res) => {
    const { CostCategory } = req.dbModels;
    const activeNodeId = req.activeNode;
    try {
        const { name = "", description = "", parent_id = "" } = req.body;
        if (!name) return res.status(400).json({ success: false, code: 400, message: "Name required!!!" });

        if (parent_id) {
            const isAvailable = await CostCategory.findOne({ where: { id: parent_id } })
            if (!isAvailable) return res.status(404).json({ success: false, code: 404, message: `Parent id not found!!!` });
        }

        const isExists = await CostCategory.findOne({
            where: {
                name: { [Op.iLike]: name.trim() },
                // location_id: activeNodeId
            }
        });
        if (isExists) return res.status(409).json({ success: false, code: 409, message: `Cost Head ${name} is already exists!!!` });

        const costCategory = await CostCategory.create({
            name: name.trim(),
            description,
            parent_id: parent_id !== "" ? parent_id : null,
            // location_id: Number(activeNodeId)
        });
        if (!costCategory) return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "CostCategory added successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// UPDATE
export const updateCostCategory = asyncHandler(async (req, res) => {
    const { CostCategory } = req.dbModels;
    try {
        const { id = "", name = "", description = "", status = "", parent_id = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required." });

        const costCategory = await CostCategory.findByPk(Number(id));
        if (!costCategory) return res.status(404).json({ success: false, code: 404, message: `CostCategory not found!!!` });

        let updateDetails = {};
        if (name) updateDetails.name = name.trim();
        if (description) updateDetails.description = description;
        if (status) updateDetails.status = status;
        if (parent_id) {
            updateDetails.parent_id = parent_id == 0 ? null : parent_id;
        }

        const isUpdate = await costCategory.update(updateDetails);
        if (!isUpdate) return res.status(400).json({ success: false, code: 400, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
export const deleteCostCategory = asyncHandler(async (req, res) => {
    const { CostCategory } = req.dbModels;
    const activeNodeId = req.activeNode;
    try {
        const { id } = req.params;

        const isExists = await CostCategory.findOne({
            where: {
                id: Number(id),
                // location_id: activeNodeId
            }
        });
        if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        const isDeleted = await CostCategory.destroy({
            where: {
                id: Number(id),
                // location_id: activeNodeId
            }
        });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});