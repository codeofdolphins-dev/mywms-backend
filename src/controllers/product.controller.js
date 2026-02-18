import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { saveBase64Image, deleteImage, moveFile } from "../utils/handelImage.js";


// GET
const allProductList = asyncHandler(async (req, res) => {
    const { Product, Category, HSN, Brand, PackageType, UnitType, CategoryProducts } = req.dbModels;
    try {
        let { page = 1, limit = 10, barcode = "", id = "", text = "", type = "raw", noLimit = false } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const product = await Product.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(barcode && { barcode: Number(barcode) }),
                ...(text && {
                    [Op.or]: [
                        {
                            name: {
                                [Op.iLike]: `${text}%`
                            }
                        },
                        {
                            barcode: {
                                [Op.eq]: text
                            }
                        },
                        {
                            sku: {
                                [Op.iLike]: `${sku}%`
                            }
                        },
                    ]
                }),
                product_type: type,
            },
            include: [
                {
                    model: HSN,
                    as: "hsn"
                },
                {
                    model: Brand,
                    as: "productBrands",
                    through: { attributes: [] },
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
            ...(noLimit && { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        await helper(req.dbModels, product);
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

    const { Product, HSN, Category, Brand, PackageType, UnitType } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers['x-tenant-id'];
    let photo = req?.file?.filename || null;

    try {
        let {
            name = "", categories = "", brands = "",
            hsn_id = "", sku = "", barcode = "",
            package_type_id = "", unit_type_id = "", measure = "",
            description = "", reorder_level = ""
        } = req.body;
        console.log(brands)

        if ([name, hsn_id, barcode, package_type_id, unit_type_id, brands, categories].some(item => item === "")) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        // convert string
        brands = JSON.parse(brands);
        categories = JSON.parse(categories);

        const isExists = await Product.findOne({ where: { barcode } })
        if (isExists) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with barcode: ${barcode} already exists!!!` });
        }

        const isSKUExists = await Product.findOne({ where: { sku } })
        if (isSKUExists) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with sku: ${sku} already exists!!!` });
        }

        const hsn = await HSN.findByPk(Number(hsn_id));
        if (!hsn) {
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
        }

        // const existingBrands = await Brand.findAll({
        //     where: {
        //         id: {
        //             [Op.in]: brands
        //         }
        //     }
        // });
        const existingBrands = await Brand.findOne({
            where: {
                id: Number(brands)
            }
        });
        // if (existingBrands.length !== brands.length) {
        if (!existingBrands) {
            await deleteImage(photo, dbName);
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
            await deleteImage(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Some Categorys were not found!!!" });
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

        // if (product_type === "finished" && req?.file === undefined && base64Image) {
        //     profile_image = await saveBase64Image(base64Image);
        // };

        const product = await Product.create({
            name: name.trim(),
            hsn_code: hsn.hsn_code,
            sku,
            barcode,
            // gst_rate: Number(gst_rate),
            // is_taxable: is_taxable,
            package_type: packageType.name,
            measure,
            unit_type: unitType.name,
            description,
            reorder_level: Number(reorder_level),
            ...(photo ? { photo: `${dbName}/${photo}` } : null)
        }, { transaction });

        if (!product) throw new Error("Insertion failed!!!");
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
        if (photo) await deleteImage(photo, dbName);
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
    const { Product, HSN, Category, Brand, PackageType, UnitType } = req.dbModels;
    const dbName = req.headers["x-tenant-id"];
    const profile_image = req?.file?.filename || null;
    const transaction = await req.dbObject.transaction();

    try {
        let {
            id = "", name = "", categories = "", brands = "",
            hsn_id = "", sku = "", barcode = "",
            gst_type = "", package_type_id = "",
            unit_type_id = "", measure = "", unit = "", MRP = "",
            description = "", purchase_price = "", reorder_level = "", is_active = ""
        } = req.body;

        if (!(id || barcode)) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "id or barcode required!!!" });
        }

        const product = await Product.findOne({
            where: (barcode || id) ? {
                [Op.or]: [
                    { barcode: Number(barcode) || null },
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
        if (brands) {
            brands = JSON.parse(brands);

            const brand = await Brand.findAll({
                where: {
                    id: {
                        [Op.in]: brands
                    }
                }
            })
            if (!brand) {
                if (profile_image) await deleteImage(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Some brands were not found!!!" });
            };
            product.setProductBrands(brand);
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
        if (gst_type) product.gst_type = gst_type.trim().toLowerCase();

        if (package_type_id) {
            const packageType = await PackageType.findByPk(Number(package_type_id));
            console.log(packageType)
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

        // if (unit) product.unit = unit;
        if (measure) product.measure = measure;
        if (description) product.description = description;
        // if (purchase_price) product.purchase_price = purchase_price;
        // if (MRP) product.MRP = parseFloat(MRP);
        if (reorder_level) product.reorder_level = Number(reorder_level);
        if (is_active) product.is_active = is_active;

        if (profile_image) {
            if (product.photo) {
                await deleteImage(product.photo);
            }
            product.photo = `${dbName}/${profile_image}`;
        }

        const isUpdate = await product.save({ transaction })
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