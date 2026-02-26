import { generateVenCatCode } from "../helper/generate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Op } from "sequelize";

// GET
export const allVendorCategoryList = asyncHandler(async (req, res) => {
    const { VendorCategory } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", text = "", noLimit = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const vendorCategory = await VendorCategory.findAndCountAll({
            where: {
                ...(id && { id }),
                ...(text && {
                    [Op.or]: [
                        { name: { [Op.iLike]: `${text}%` } },
                        { code: { [Op.iLike]: code } },
                    ]
                })
            },
            ...(noLimit && { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        if (!vendorCategory) return res.status(400).json({ success: false, code: 400, message: "User not found!!!" });

        const totalItems = vendorCategory.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: id ? vendorCategory.rows[0] : vendorCategory.rows,
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
export const createVendorCategory = asyncHandler(async (req, res) => {
    const { VendorCategory } = req.dbModels;
    try {
        const { name = "", desc = "" } = req.body;
        if (!name) return res.status(500).json({ success: false, code: 500, message: "Name required!!!" });

        const code = generateVenCatCode(name);
        const isExists = await VendorCategory.findOne({ where: { code } });
        if (isExists) throw new Error("Category already exists!!!");

        await VendorCategory.create({
            name,
            code,
            desc
        });

        return res.status(200).json({ success: true, code: 200, message: "Category created successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
export const updateVendorCategoryDetails = asyncHandler(async (req, res) => {
    const { VendorCategory } = req.dbModels;
    try {
        const { id = "", name = "", desc = "", is_active = "" } = req.body;
        if (!id) return res.status(404).json({ success: false, code: 404, message: 'Id must required' });

        const vendorCategory = await VendorCategory.findByPk(Number(id));
        if (!vendorCategory) throw new Error("Record not found!!!");

        if (name) {
            const code = generateVenCatCode(name);
            vendorCategory.name = name;
            vendorCategory.code = code;
        }
        if (desc) vendorCategory.desc = desc;
        if (is_active) vendorCategory.is_active = Boolean(is_active);

        await vendorCategory.save();

        return res.status(200).json({ success: true, code: 200, message: "Record updated successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
export const deleteVendorCategory = asyncHandler(async (req, res) => {
    const { VendorCategory } = req.dbModels;
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const record = await VendorCategory.findByPk(Number(id));
        if (!record) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        const isDeleted = await VendorCategory.destroy({ where: { id: Number(id) } });
        if (!isDeleted) throw new Error("Deletion filled!!!");

        return res.status(200).json({ success: true, code: 200, message: "Record deleted" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});