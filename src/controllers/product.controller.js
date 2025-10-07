import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";

// GET
const allProductList = asyncHandler(async (req, res) => {
    const { Product, Category, HSN } = req.dbModels;
    try {
        let { page = 1, limit = 10, barcode = "", id = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const product = await Product.findAndCountAll({
            where: (barcode || id) ? { [Op.or]: [{ barcode: parseInt(barcode) || null }, { id: parseInt(id) || null }] } : undefined,
            include: [
                {
                    model: Category,
                    as: "category"
                },
                {
                    model: HSN,
                    as: "hsn"
                },
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]],
        });
        if (!product) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = product.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: product,
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
const createProduct = asyncHandler(async (req, res) => {
    const { Product, HSN, Category } = req.dbModels;

    try {
        const { name = "", category_id = "", sku = "", gst_type = "", hsn_code = "", barcode = "", description = "", unit_of_measure = "", cost_price = "", selling_price = "", reorder_level = "" } = req.body;
        const profile_image = req?.file?.filename || null;

        if ([name, category_id, hsn_code, barcode, unit_of_measure, cost_price].some(item => item === "")) return res.status(400).json({ success: false, code: 400, message: "All fields are  required!!!" });

        const isExists = await Product.findOne({ where: { barcode } })
        if (isExists) return res.status(400).json({ success: false, code: 400, message: `Product with barcode: ${barcode} already exists!!!` });

        const hsn = await HSN.findOne({ where: { hsn_code } })
        if (!hsn) return res.status(400).json({ success: false, code: 400, message: "HSN code not found!!!" });

        const category = await Category.findOne({ where: { id: category_id } })
        if (!category) return res.status(400).json({ success: false, code: 400, message: "Category not found!!!" });

        const product = await Product.create({
            name: name.trim(),
            category_id: category.id,
            sku,
            gst_type: gst_type.trim(),
            hsn_id: hsn.id,
            barcode,
            description,
            unit_of_measure,
            cost_price: parseInt(cost_price),
            selling_price: parseInt(selling_price),
            reorder_level,
            photo: profile_image
        });
        if (!product) return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Product added successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.errors[0] });
    }
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { Product } = req.dbModels;
    try {
        const { id } = req.params;      

        const product = await Product.findByPk(id);
        if (product.photo) {
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                product.photo
            );

            // Safely unlink if file exists
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        const isDeleted = await Product.destroy({ where: { id } });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateProduct = asyncHandler(async (req, res) => {
    const { Product } = req.dbModels;
    try {
        const { id = "", name = "", sku = "", gst_type = "", barcode = "", description = "", unit_of_measure = "", cost_price = "", selling_price = "", reorder_level = "", status = "" } = req.body;
        if (!id && !barcode) return res.status(400).json({ success: false, code: 400, message: "Id or Barcode required!!!" });
        const profile_image = req?.file?.filename || null;

        const product = await Product.findOne({
            where: (barcode || id) ? { [Op.or]: [{ barcode: parseInt(barcode) || null }, { id: parseInt(id) || null }] } : undefined,

        });
        if (!product) return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });

        let updateDetails = {};
        if (name) updateDetails.name = name;
        if (sku) updateDetails.sku = sku;
        if (gst_type) updateDetails.gst_type = gst_type;
        if (description) updateDetails.description = description;
        if (unit_of_measure) updateDetails.unit_of_measure = unit_of_measure;
        if (cost_price) updateDetails.cost_price = cost_price;
        if (reorder_level) updateDetails.reorder_level = reorder_level;
        if (selling_price) updateDetails.selling_price = selling_price;
        if (status) updateDetails.status = status;

        if (profile_image) {
            if (product.photo) {
                const oldImagePath = path.join(
                    process.cwd(),
                    "public",
                    "user",
                    product.photo
                );

                // Safely unlink if file exists
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateDetails.photo = profile_image;
        }

        const isUpdate = await Product.update(
            updateDetails,
            {
                where: (barcode || id) ? { [Op.or]: [{ barcode: parseInt(barcode) || null }, { id: parseInt(id) || null }] } : undefined,
            }
        );
        if (!isUpdate) return res.status(400).json({ success: false, code: 400, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateProductBatch = asyncHandler(async (req, res) => {
    const { Product } = req.dbModels;
    try {
        const { id = "", batch_no = "", barcode = "" } = req.body;
        if (!id && !barcode) return res.status(400).json({ success: false, code: 400, message: "Id or Barcode required!!!" });

        const product = await Product.findOne({
            where: {
                [Op.or]: [{ id: parseInt(id) || null }, { barcode: parseInt(barcode) || null }]
            }
        });
        if (!product) return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });

        const isUpdate = await Product.update(
            { batch_no },
            { where: { [Op.or]: [{ id: parseInt(id) || null }, { barcode: parseInt(barcode) || null }] } }
        );
        if (!isUpdate) return res.status(400).json({ success: false, code: 400, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Batch no updated Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allProductList, createProduct, deleteProduct, updateProduct, updateProductBatch };