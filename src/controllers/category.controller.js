import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const allCategoryList = asyncHandler(async (req, res) => {
    const { Category } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = null, name = null, noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const category = await Category.findAndCountAll({
            where: {
                ...(id || name ? {
                    [Op.or]: [
                        ...(id ? [{ id: parseInt(id, 10) }] : []),
                        ...(
                            name ?
                                [{ name: { [Op.iLike]: `%${name}%` } }]
                                : []
                        )
                    ]
                } : { parent_id: null })
            },
            include: {
                model: Category,
                as: 'subcategories',
                include: {
                    model: Category,
                    as: 'subcategories',
                }
            },
            ...(noLimit ? {} : { limit, offset }),
            order: [['createdAt', 'ASC']]
        });
        if (!category) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = category.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: category.rows,
            ...(noLimit
                ? {} 
                : {
                    meta: {
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
const createCategory = asyncHandler(async (req, res) => {
    const { Category } = req.dbModels;
    try {
        const { name = "", description = "", parent_id = "" } = req.body;
        if (!name) return res.status(400).json({ success: false, code: 400, message: "Both fields are  required!!!" });

        if (parent_id) {
            const isAvailable = await Category.findOne({ where: { id: parent_id } })
            if (!isAvailable) return res.status(404).json({ success: false, code: 404, message: `Parent id not found!!!` });
        }

        const isExists = await Category.findOne({ where: { name } });
        if (isExists) return res.status(409).json({ success: false, code: 409, message: `Category ${name} is already exists!!!` });

        const category = await Category.create({
            name,
            description,
            parent_id: parent_id !== "" ? parent_id : null
        });
        if (!category) return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Category added successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { Category } = req.dbModels;
    try {
        const { id } = req.params;

        const isDeleted = await Category.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateCategory = asyncHandler(async (req, res) => {
    const { Category } = req.dbModels;
    try {
        const { id = "", name = "", description = "", status = "", parent_id = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required." });

        let updateDetails = {};
        if (name) updateDetails.name = name;
        if (description) updateDetails.description = description;
        if (status) updateDetails.status = status;
        if (parent_id) {
            updateDetails.parent_id = parent_id == 0 ? null : parent_id;
        }

        console.log(updateDetails);

        const isUpdate = await Category.update(
            updateDetails,
            { where: { id } }
        );
        if (!isUpdate) return res.status(400).json({ success: false, code: 400, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { createCategory, allCategoryList, deleteCategory, updateCategory };