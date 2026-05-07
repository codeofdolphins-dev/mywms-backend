import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/handelImage.js";


// GET
export const allProductList = asyncHandler(async (req, res) => {
    const { Product, HSN, Brand, PackageType, UnitType } = req.dbModels;
    try {
        let { page = 1, limit = 10, barcode = "", id = "", text = "", type = "finished", noLimit = false } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const product = await Product.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(barcode && { barcode: barcode }),
                ...(text && {
                    [Op.or]: [
                        {
                            name: {
                                [Op.iLike]: `${text}%`
                            }
                        },
                        {
                            barcode: {
                                [Op.like]: `${text}%`
                            }
                        },
                        {
                            sku: {
                                [Op.iLike]: `${text}%`
                            }
                        },
                    ]
                }),
                product_type: type,
            },
            ...(type === "raw" && {
                attributes: ["id", "name", "product_type", "unit_type", "description", "reorder_level", "is_active", "photo", "sku", "createdAt", "updatedAt"]
            }),
            include: [
                {
                    model: HSN,
                    as: "hsn"
                },
                {
                    model: Brand,
                    as: "brand",
                    // attributes: ["name"]
                },
                {
                    model: PackageType,
                    as: "packageType",
                    // attributes: ["name"]
                },
                {
                    model: UnitType,
                    as: "unitRef",
                    // attributes: ["name"]
                },
            ],
            ...(!noLimit && { limit, offset }),
            order: [["createdAt", "ASC"]],
        });

        if (type !== "raw") {
            await helper(req.dbModels, product);
        };

        if (!product) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = product.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: product.rows,
            ...(!noLimit && {
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            })
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createFinishedProduct = asyncHandler(async (req, res) => {
    // console.log(req.body); return

    const { Product, HSN, Category, Brand, PackageType, UnitType } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers['x-tenant-id'];
    let photo = req?.file?.filename || null;

    try {
        let {
            name = "", categories = "", brand_id = "",
            hsn_id = "", sku = "", barcode = "",
            package_type_id = "", unit_type_id = "", measure = "",
            description = "", reorder_level = "", has_expiry = false, shelf_life = ""
        } = req.body;

        if ([name, hsn_id, barcode, package_type_id, unit_type_id].some(item => item === "")) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        // convert string
        if (categories) categories = JSON.parse(categories);

        /** check product is exists */
        const isExists = await Product.findOne({ where: { barcode } })
        if (isExists) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with barcode: ${barcode} already exists!!!` });
        }

        /** check sku is exists */
        const isSKUExists = await Product.findOne({ where: { sku } })
        if (isSKUExists) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with sku: ${sku} already exists!!!` });
        }

        /** check hsn is exists */
        const hsn = await HSN.findByPk(Number(hsn_id));
        if (!hsn) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
        }

        /** check brand is exists */
        if (brand_id) {
            const existingBrand = await Brand.findOne({ where: { id: Number(brand_id) } });
            if (!existingBrand) {
                await deleteImage(photo, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Brand not found!!!" });
            }
        }

        /** check categories is exists */
        let existingCategories = null;
        if (categories) {
            existingCategories = await Category.findAll({
                where: {
                    id: {
                        [Op.in]: categories
                    }
                }
            });
            if (existingCategories.length !== categories.length) {
                await deleteImage(photo, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Some Categorys were not found!!!" });
            }
        }

        const packageType = await PackageType.findByPk(Number(package_type_id));
        if (!packageType) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Package Type not found!!!" });
        }

        const unitType = await UnitType.findByPk(Number(unit_type_id));
        if (!unitType) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Unit Type not found!!!" });
        }
        if (has_expiry) {
            if ((has_expiry === "true" || has_expiry === true) && !shelf_life) {
                if (photo) await deleteImage(photo, dbName);
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 400, message: "Shelf life is required!!!" });
            }
        }

        const product = await Product.create({
            name: name.trim(),
            hsn_code: hsn.hsn_code,
            sku,
            barcode,
            ...(brand_id && { brand_id: Number(brand_id) }),
            // gst_rate: Number(gst_rate),
            // is_taxable: is_taxable,
            has_expiry: Boolean(has_expiry),
            ...(has_expiry && { shelf_life: Number(shelf_life) }),
            package_type: packageType.name,
            measure,
            unit_type: unitType.name,
            description,
            reorder_level: Number(reorder_level),
            ...(photo ? { photo: `${dbName}/${photo}` } : null),
            product_type: "finished"
        }, { transaction });

        if (!product) throw new Error("Insertion failed!!!");
        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(product)));

        /** add product categories only if categories is not empty */
        if (existingCategories && existingCategories.length > 0) {
            await product.addProductCategories(existingCategories, { transaction });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Finished Product added successfully." });

    } catch (error) {
        await transaction.rollback();
        if (photo) await deleteImage(photo, dbName);
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const createRawProduct = asyncHandler(async (req, res) => {
    // console.log(req.body); return

    const { Product, UnitType } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers['x-tenant-id'];
    let photo = req?.file?.filename || null;

    try {
        let { name = "", unit_type_id = "", description = "", reorder_level = "", barcode = "", p_code = "" } = req.body;

        if ([name, unit_type_id].some(item => item === "")) {
            if (photo) await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        const unitType = await UnitType.findByPk(Number(unit_type_id));
        if (!unitType) {
            if (photo) await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Unit Type not found!!!" });
        };

        const isExists = await Product.findOne({
            where: {
                unit_type: unitType.name,
                name: { [Op.iLike]: name.trim() },
                product_type: "raw"
            }
        })
        if (isExists) {
            if (photo) await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product already exists!!!` });
        };

        const product = await Product.create({
            name: name?.trim(),
            sku: p_code,
            ...(barcode?.trim() && { barcode: barcode.trim() }),
            unit_type: unitType.name,
            description,
            reorder_level: Number(reorder_level),
            product_type: "raw",
            ...(photo ? { photo: `${dbName}/${photo}` } : null)
        }, { transaction });

        if (!product) throw new Error("Insertion failed!!!");
        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(product)));


        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Raw Product added" });

    } catch (error) {
        await transaction.rollback();
        if (photo) await deleteImage(photo, dbName);
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
export const deleteProduct = asyncHandler(async (req, res) => {
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
export const updateProduct = asyncHandler(async (req, res) => {
    const { Product, HSN, Category, Brand, PackageType, UnitType } = req.dbModels;
    const dbName = req.headers["x-tenant-id"];
    const profile_image = req?.file?.filename || null;
    const transaction = await req.dbObject.transaction();

    // console.log(req.body); return

    try {
        let {
            id = "", name = "", categories = "", brand_id = "",
            hsn_id = "", sku = "", barcode = "", package_type_id = "",
            unit_type_id = "", measure = "", has_expiry = false, shelf_life = "",
            description = "", reorder_level = "", is_active = ""
        } = req.body;

        if (!(id || barcode)) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "id or barcode required!!!" });
        }

        const product = await Product.findOne({
            where: (barcode || id) ? {
                [Op.or]: [
                    { barcode: barcode },
                    { id: Number(id) || null }
                ]
            } : undefined,
        });
        if (!product) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
        }

        if (name) product.name = name;
        if (categories) {
            categories = JSON.parse(categories);

            const category = await Category.findAll({
                where: {
                    id: {
                        [Op.in]: categories
                    }
                }
            })
            if (!category) {
                if (profile_image) await deleteImage(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Some categories were not found!!!" });
            };
            product.setProductCategories(category);
        }
        if (brand_id) {
            const brand = await Brand.findOne({
                where: { id: Number(brand_id) }
            })
            if (!brand) {
                if (profile_image) await deleteImage(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Some brands were not found!!!" });
            };
            product.brand_id = brand.id;
        }
        if (hsn_id) {
            const hsn = await HSN.findByPk(Number(hsn_id));
            if (!hsn) {
                if (profile_image) await deleteImage(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
            };
            product.hsn_id = hsn.id;
        }
        if (sku) product.sku = sku;
        if (package_type_id) {
            const packageType = await PackageType.findByPk(Number(package_type_id));
            if (!packageType) {
                if (profile_image) await deleteImage(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "PackageType not found!!!" });
            };
            product.package_type = packageType.name;
        }
        if (unit_type_id) {
            const unitType = await UnitType.findByPk(Number(unit_type_id));
            if (!unitType) {
                if (profile_image) await deleteImage(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "UnitType not found!!!" });
            };
            product.unit_type = unitType.name;
        }
        if (measure) product.measure = measure;
        if (description) product.description = description;
        if (reorder_level) product.reorder_level = Number(reorder_level);
        if (is_active) product.is_active = is_active;
        if (profile_image) {
            if (product.photo) {
                await deleteImage(product.photo);
            }
            product.photo = `${dbName}/${profile_image}`;
        }
        if (has_expiry !== "") {
            if (has_expiry === "true" && !shelf_life) {
                if (profile_image) await deleteImage(profile_image, dbName);
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 400, message: "Shelf life is required!!!" });
            }
            if (has_expiry === "true" && shelf_life) {
                product.has_expiry = true;
                product.shelf_life = Number(shelf_life);
            }
            if (has_expiry === "false") {
                product.has_expiry = false;
                product.shelf_life = 0;
            }
        }

        const isUpdate = await product.save({ transaction });
        if (!isUpdate) throw new Error("Updation failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
export const updateProductBatch = asyncHandler(async (req, res) => {
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



/**
 * 
 * @param {Object} models DB model
 * @param {Object} product product fetched data from DB
 */
async function helper(models, product) {
    const { CategoryProducts, Category } = models;

    if (product.rows && product.rows.length > 0) {
        const productIds = product.rows.map(p => p.id);

        // Get all CategoryProducts entries for these products
        const categoryProducts = await CategoryProducts.findAll({
            where: {
                product_id: {
                    [Op.in]: productIds
                }
            },
            raw: true
        });

        if (categoryProducts.length > 0) {
            const categoryIds = [...new Set(categoryProducts.map(cp => cp.category_id))];

            // Get all categories (both parent and child)
            const allCategories = await Category.findAll({
                where: {
                    id: {
                        [Op.in]: categoryIds
                    }
                },
                raw: true
            });

            // Organize categories
            const parentCategories = allCategories.filter(cat => cat.parent_id === null);
            const childCategories = allCategories.filter(cat => cat.parent_id !== null);

            // Group categoryProducts by product_id
            const categoriesByProduct = {};
            categoryProducts.forEach(cp => {
                if (!categoriesByProduct[cp.product_id]) {
                    categoriesByProduct[cp.product_id] = [];
                }
                categoriesByProduct[cp.product_id].push(cp.category_id);
            });

            // Organize child categories by parent_id
            const childCategoriesByParent = {};
            childCategories.forEach(child => {
                if (!childCategoriesByParent[child.parent_id]) {
                    childCategoriesByParent[child.parent_id] = [];
                }
                childCategoriesByParent[child.parent_id].push(child);
            });

            // Attach categories to each product
            product.rows.forEach(prod => {
                const productCategoryIds = categoriesByProduct[prod.id] || [];

                // ADDED: Store all selected category IDs for this product
                prod.dataValues.selectedCategoryIds = [...productCategoryIds];

                // Get parent categories for this product
                const productParentCategories = parentCategories.filter(cat =>
                    productCategoryIds.includes(cat.id)
                );

                // For each parent category, add its subcategories
                const productCategoriesWithSubs = productParentCategories.map(parentCat => {
                    const parentObj = { ...parentCat };

                    // Get subcategories that are also linked to this product
                    const subcategoriesForParent = childCategoriesByParent[parentCat.id] || [];
                    const linkedSubcategories = subcategoriesForParent.filter(subcat =>
                        productCategoryIds.includes(subcat.id)
                    );

                    parentObj.subcategories = linkedSubcategories;
                    return parentObj;
                });

                // Attach to product
                prod.dataValues.productCategories = productCategoriesWithSubs;
            });
        } else {
            // Handle case where no category products exist
            product.rows.forEach(prod => {
                prod.dataValues.selectedCategoryIds = [];
                prod.dataValues.productCategories = [];
            });
        }
    }
}