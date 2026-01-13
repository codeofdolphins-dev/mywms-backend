import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { saveBase64Image, deleteImage, moveFile } from "../utils/handelImage.js";


// GET
const allProductList = asyncHandler(async (req, res) => {
    const { Product, Category, HSN, Brand } = req.dbModels;
    try {
        let { page = 1, limit = 10, barcode = "", id = "", name = "", type = "raw" } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const updateQuery = {};
        if (barcode) updateQuery.barcode = barcode;
        if (id) updateQuery.id = parseInt(id, 10);
        if (type) updateQuery.product_type = type;
        // if (hsn_code) {
        //     const hsn = await HSN.findOne({ where: { hsn_code } });
        //     if (!hsn) return res.status(404).json({ success: false, code: 404, message: "Hsn record not found!!!" });
        //     updateQuery.hsn_id = hsn.id;
        // }
        if (name) updateQuery.name = {
            [Op.iLike]: `${name}%`
        };

        // console.log(updateQuery); return        

        const product = await Product.findAndCountAll({
            where: updateQuery ? updateQuery : undefined,
            include: [
                {
                    model: HSN,
                    as: "hsn"
                },
                {
                    model: Category,
                    as: "productCategories",
                    through: { attributes: [] },
                    // attributes: ["name"]
                    where: {
                        parent_id: null
                    },
                    include: [
                        {
                            model: Category,
                            as: "subcategories"
                        }
                    ]
                },
                {
                    model: Brand,
                    as: "productBrands",
                    through: { attributes: [] },
                    // attributes: ["name"]
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
            data: product.rows,
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
const createRawProduct = asyncHandler(async (req, res) => {
    // console.log(req.body); return

    const { Product, HSN, Category, BillOfMaterial, Brand, PackageType, UnitType } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers['x-tenant-id'];
    let profile_image = null;

    try {
        let {
            name = "", categories = "", brands = "",
            hsn_id = "", sku = "", barcode = "",
            gst_type = "", product_type = "raw", package_type_id = "",
            unit_type_id = "", measure = "", unit = "", MRP = "",
            description = "", purchase_price = "", reorder_level = "",
        } = req.body;

        if ([name, hsn_id, barcode, package_type_id, unit_type_id, brands, categories].some(item => item === "")) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are  required!!!" });
        };

        // convert string
        brands = JSON.parse(brands);
        categories = JSON.parse(categories);

        const isExists = await Product.findOne({ where: { barcode } })
        if (isExists) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with barcode: ${barcode} already exists!!!` });
        }

        const hsn = await HSN.findByPk(Number(hsn_id));
        if (!hsn) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
        }

        const existingBrands = await Brand.findAll({
            where: {
                id: {
                    [Op.in]: brands
                }
            }
        });
        if (existingBrands.length !== brands.length) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Some Brands were not found!!!" });
        }

        const existingCategories = await Category.findAll({
            where: {
                id: {
                    [Op.in]: categories
                }
            }
        });
        if (existingCategories.length !== categories.length) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Some Categorys were not found!!!" });
        }
        
        const packageType = await PackageType.findByPk(Number(package_type_id));
        if (!packageType) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Package Type not found!!!" });
        }
        
        const unitType = await UnitType.findByPk(Number(unit_type_id));
        if (!unitType) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Unit Type not found!!!" });
        }

        // if (product_type === "finished" && req?.file === undefined && base64Image) {
        //     profile_image = await saveBase64Image(base64Image);
        // };

        const product = await Product.create({
            name: name.trim(),
            hsn_id: hsn.id,
            sku,
            barcode,
            gst_type: gst_type !== "" ? gst_type.trim().toLowerCase() : undefined,
            product_type: product_type.toLowerCase().trim(),
            package_type: packageType.name,
            unit_type: unitType.name,
            measure,
            unit,
            description,
            purchase_price: parseFloat(purchase_price),
            MRP: parseFloat(MRP),
            reorder_level: Number(reorder_level),
            photo: profile_image ? `${dbName}/${profile_image}` : null
        }, { transaction });

        if (!product) {
            await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });
        }
        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(product)));
        await product.addProductBrands(existingBrands, { transaction });
        await product.addProductCategories(existingCategories, { transaction });

        // if (product_type === "finished" && req.body?.items.length > 0) {
        //     const { items } = req.body;

        //     for (const item of items) {
        //         const rawProduct = await Product.findOne({ where: { barcode: parseInt(item.raw_product_barcode, 10) } })
        //         if (!rawProduct) {
        //             await transaction.rollback();
        //             await deleteImage(profile_image, dbName);
        //             return res.status(400).json({ success: false, code: 400, message: `Product with barcode: ${item.raw_product_barcode} not found!!!` });
        //         }

        //         const BOM = await BillOfMaterial.create({
        //             finished_product_id: product.id,
        //             raw_product_id: rawProduct.id,
        //             quantity_required: parseInt(item.qty, 10),
        //             uom: item.uom
        //         }, { transaction });

        //         if (!BOM) {
        //             await transaction.rollback();
        //             await deleteImage(profile_image, dbName);
        //             return res.status(500).json({ success: false, code: 500, message: "Insertion failed for BOM!!! " });
        //         }
        //     }
        // }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Product added successfully." });

    } catch (error) {
        await transaction.rollback();
        if (profile_image) await deleteImage(profile_image, dbName);
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
    const dbName = req.headers["x-tenant-id"];
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
        if (!(id || barcode)) return res.status(400).json({ success: false, code: 400, message: "id or barcode required!!!" });
        const profile_image = req?.file?.filename || null;

        const product = await Product.findOne({
            where: (barcode || id) ? { [Op.or]: [{ barcode: parseInt(barcode) || null }, { id: parseInt(id) || null }] } : undefined,
        });
        if (!product) return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });

        let updateDetails = {};
        if (name) updateDetails.name = name;
        if (last_category_id) {
            const category = await Category.findOne({ where: { id: parseInt(last_category_id, 10) } })
            if (!category) {
                return res.status(404).json({ success: false, code: 404, message: "Category not found!!!" });
            };
            updateDetails.last_category_id = parseInt(last_category_id, 10)
        }
        if (brand_id) {
            const brand = await Brand.findOne({ where: { id: parseInt(brand_id, 10) } })
            if (!brand) {
                return res.status(404).json({ success: false, code: 404, message: "Brand not found!!!" });
            };
            updateDetails.brand_id = parseInt(brand_id, 10);
        }
        if (hsn_code) {
            const hsn = await HSN.findOne({ where: { hsn_code } })
            if (!hsn) {
                return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
            };
            updateDetails.hsn_id = hsn.id;
        }
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
            updateDetails.photo = `${dbName}/${profile_image}`;
        }

        const [isUpdate] = await Product.update(
            updateDetails,
            {
                where: (barcode || id) ? { [Op.or]: [{ barcode: parseInt(barcode) || null }, { id: parseInt(id) || null }] } : undefined,
            }
        );
        if (!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

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
        const { batch_id = "", batch_no = "", barcode = "" } = req.body;
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

export { allProductList, createRawProduct, deleteProduct, updateProduct, updateProductBatch };