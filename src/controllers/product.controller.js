import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { saveBase64Image, deleteImage } from "../utils/handelImage.js";


// GET
const allProductList = asyncHandler(async (req, res) => {
    const { Product, Category, HSN } = req.dbModels;
    try {
        let { page = 1, limit = 10, barcode = "", id = "" } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
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
    const { Product, HSN, Category, BillOfMaterial, Brand } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    let profile_image = null;

    try {
        const {
            name = "",
            category_id = "",
            last_category_id = "",
            brand_id = "",
            hsn_code = "",
            sku = "",
            barcode = "",
            gst_type = "",
            product_type = "raw",
            package_type = "",
            measure = "",
            unit = "",
            description = "",
            selling_price = "",
            MRP = "",
            reorder_level = "",
            base64Image = null
        } = req.body;

        // check image object exists or not
        if (req?.file?.filename) profile_image = req?.file?.filename;

        if ([name, category_id, hsn_code, barcode, unit_of_measure, cost_price].some(item => item === "")) return res.status(400).json({ success: false, code: 400, message: "All fields are  required!!!" });

        const isExists = await Product.findOne({ where: { barcode } })
        if (isExists) {
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with barcode: ${barcode} already exists!!!` });
        }

        const hsn = await HSN.findOne({ where: { hsn_code } })
        if (!hsn) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
        }

        const category = await Category.findOne({ where: { id: parseInt(last_category_id, 10) } })
        if (!category) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Category not found!!!" });
        }

        const brand = await Brand.findOne({ where: { id: parseInt(brand_id, 10) } })
        if (!brand) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Brand not found!!!" });
        }

        const product = await Product.create({
            name: name.trim(),
            last_category_id: category.id,
            brand_id: brand.id,
            hsn_id: hsn.id,
            sku,
            barcode,
            gst_type: gst_type !== "" ? gst_type.trim().toLowerCase() : undefined,
            product_type: product_type !== "" ? product_type.toLowerCase().trim() : undefined,
            package_type: package_type !== "" ? package_type.trim().toLowerCase() : undefined,
            measure,
            unit,
            description,
            selling_price: parseFloat(selling_price),
            cost_price: parseInt(cost_price),
            MRP: parseInt(MRP),
            reorder_level,
            photo: profile_image
        }, { transaction });
        if (!product) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });
        }

        if (product_type === "finished" && req?.file === undefined && base64Image) {
            profile_image = await saveBase64Image(base64Image);
        };

        if (product_type === "finished") {
            const { items } = req.body;
            if (items.length < 1) {
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 400, message: "No Raw products found!!!" });
            }

            for (const item of items) {
                const rawProduct = await Product.findOne({ where: { barcode: parseInt(item.raw_product_barcode, 10) } })
                if (!rawProduct) {
                    await transaction.rollback();
                    await deleteImage(profile_image)
                    return res.status(400).json({ success: false, code: 400, message: `Product with barcode: ${item.raw_product_barcode} not found!!!` });
                }

                const BOM = await BillOfMaterial.create({
                    finished_product_id: product.id,
                    raw_product_id: rawProduct.id,
                    quantity_required: parseInt(item.qty, 10),
                    uom: item.uom
                }, { transaction });

                if (!BOM) {
                    await transaction.rollback();
                    await deleteImage(profile_image)
                    return res.status(500).json({ success: false, code: 500, message: "Insertion failed for BOM!!! " });
                }
            }
        }
        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Product added successfully." });

    } catch (error) {
        await transaction.rollback();
        await deleteImage(profile_image)
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteProduct = asyncHandler(async (req, res) => {
    const { Product } = req.dbModels;
    try {
        const { id } = req.params;

        const product = await Product.findByPk(parseInt(id, 10));
        if (!product) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        if (product.photo) {
            await deleteImage(product.photo);
        }

        const isDeleted = await Product.destroy({ where: { id } });
        if (!isDeleted) return res.status(501).json({ success: false, code: 501, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateProduct = asyncHandler(async (req, res) => {
    const { Product, HSN, Category, Brand } = req.dbModels;
    try {
        const {
            id = "",
            barcode = "",
            name = "",
            last_category_id = "",
            brand_id = "",
            hsn_code = "",
            sku = "",
            gst_type = "",
            package_type = "",
            measure = "",
            unit = "",
            description = "",
            selling_price = "",
            MRP = "",
            reorder_level = "",
            isActive = "",
        } = req.body;
        if (!id && !barcode) return res.status(400).json({ success: false, code: 400, message: "Id or Barcode required!!!" });
        const profile_image = req?.file?.filename || null;

        const product = await Product.findOne({
            where: (barcode || id) ? { [Op.or]: [{ barcode: parseInt(barcode) || null }, { id: parseInt(id) || null }] } : undefined,
        });
        if (!product) return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });

        const hsn = await HSN.findOne({ where: { hsn_code } })
        if (!hsn) {
            return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
        };
        const category = await Category.findOne({ where: { id: parseInt(last_category_id, 10) } })
        if (!category) {
            return res.status(404).json({ success: false, code: 404, message: "Category not found!!!" });
        };
        const brand = await Brand.findOne({ where: { id: parseInt(brand_id, 10) } })
        if (!brand) {
            return res.status(404).json({ success: false, code: 404, message: "Brand not found!!!" });
        };

        let updateDetails = {};
        if (name) updateDetails.name = name;
        if (last_category_id) updateDetails.last_category_id = parseInt(last_category_id, 10)
        if (brand_id) updateDetails.brand_id = parseInt(brand_id, 10);
        if (hsn_code) updateDetails.hsn_id = hsn.id;
        if (sku) updateDetails.sku = sku;
        if (gst_type) updateDetails.gst_type = gst_type;
        if (package_type) updateDetails.package_type = package_type;
        if (measure) updateDetails.measure = measure;
        if (unit) updateDetails.unit = unit;
        if (description) updateDetails.description = description;
        if (selling_price) updateDetails.selling_price = selling_price;
        if (MRP) updateDetails.MRP = MRP;
        if (reorder_level) updateDetails.reorder_level = reorder_level;
        if (isActive) updateDetails.isActive = isActive;
        if (profile_image) {
            if (product.photo) {
                await deleteImage(product.photo);
            }
            updateDetails.photo = profile_image;
        }

        const [isUpdate] = await Product.update(
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

// PUT
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