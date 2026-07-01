import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFile } from "../utils/handelImage.js";
import { getUserContext } from "../utils/getUserContext.js"
import ExcelJS from "exceljs";
import { insertBulkBrand, insertBulkHsn, insertBulkPackType, insertBulkUnitType } from "../services/product.service.js";
import { getTenantConnection } from "../db/tenantMenager.service.js";


// GET
export const allProductList = asyncHandler(async (req, res) => {
    const { Product, HSN, Brand, PackageType, UnitType } = req.dbModels;
    try {
        let { page = 1, limit = 10, barcode = "", id = "", text = "", type = "", noLimit = false } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const product = await Product.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(barcode && { barcode: barcode }),
                ...(text && {
                    [Op.or]: [
                        { name: { [Op.iLike]: `${text}%` } },
                        { barcode: { [Op.like]: `${text}%` } },
                        { sku: { [Op.iLike]: `${text}%` } },
                    ]
                }),
                ...(type && { product_type: type }),
            },
            // ...(type === "raw" && {
            //     attributes: ["id", "name", "barcode", "product_type", "unit_type", "description", "reorder_level", "is_active", "photo", "sku", "createdAt", "updatedAt"]
            // }),
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
            order: [["createdAt", "DESC"]],
        });

        await getCategory(req.dbModels, product);
        await addTotalStock(req, product);
        // if (type !== "raw") {
        // };

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

export const finishedProductListOverTenant = asyncHandler(async (req, res) => {
    try {
        const { models } = await getTenantConnection(req.query.tenant);
        const { Product, HSN, Brand } = models;

        const product = await Product.findAndCountAll({
            where: {
                product_type: "finished"
            },
            include: [
                {
                    model: HSN,
                    as: "hsn"
                },
                {
                    model: Brand,
                    as: "brand",
                }
            ],
            order: [["createdAt", "DESC"]],
        });
        if (!product) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        await getCategory(models, product);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: product.rows
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createProduct = asyncHandler(async (req, res) => {
    // console.log(req.body); return    

    const { Product, HSN, Category, Brand, PackageType, UnitType } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers['x-tenant-id'];
    let photo = req?.file?.filename || null;

    try {
        let {
            name = "", categories = "", brand_id = "",
            hsn_id = "", sku = "", barcode = "", product_type = "finished",
            package_type_id = "", unit_type_id = "", measure = "",
            description = "", reorder_level = "", has_expiry = false, shelf_life = "", mrp = ""
        } = req.body;

        if ([name, barcode, package_type_id, unit_type_id, sku].some(item => item === "")) {
            await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        // convert string
        if (categories) categories = JSON.parse(categories);

        /** check product is exists */
        const isExists = await Product.findOne({ where: { barcode } })
        if (isExists) {
            await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with barcode: ${barcode} already exists!!!` });
        }

        /** check sku is exists */
        const isSKUExists = await Product.findOne({ where: { sku } })
        if (isSKUExists) {
            await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product with sku: ${sku} already exists!!!` });
        }

        /** check hsn is exists */
        let hsn = null;
        if (hsn_id !== "") {
            hsn = await HSN.findByPk(Number(hsn_id));
            if (!hsn) {
                await deleteFile(photo, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
            }
        }

        /** check brand is exists */
        if (brand_id !== "") {
            const existingBrand = await Brand.findOne({ where: { id: Number(brand_id) } });
            if (!existingBrand) {
                await deleteFile(photo, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Brand not found!!!" });
            }
        }

        /** check categories is exists */
        let existingCategories = null;
        if (categories !== "") {
            existingCategories = await Category.findAll({
                where: {
                    id: {
                        [Op.in]: categories
                    }
                }
            });
            if (existingCategories.length !== categories.length) {
                await deleteFile(photo, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Some Categorys were not found!!!" });
            }
        }

        const packageType = await PackageType.findByPk(Number(package_type_id));
        if (!packageType) {
            await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Package Type not found!!!" });
        }

        const unitType = await UnitType.findByPk(Number(unit_type_id));
        if (!unitType) {
            await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Unit Type not found!!!" });
        }

        const hasExpiryBool = has_expiry === "true" || has_expiry === true;

        if (hasExpiryBool && !shelf_life) {
            if (photo) await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Shelf life is required!!!" });
        }

        const product = await Product.create({
            name: name.trim(),
            ...(hsn && { hsn_code: hsn.hsn_code }),
            sku,
            barcode,
            ...(brand_id && { brand_id: Number(brand_id) }),
            has_expiry: hasExpiryBool,
            ...(hasExpiryBool && { shelf_life: Number(shelf_life) }),
            package_type: packageType.name,
            measure,
            unit_type: unitType.name,
            description,
            reorder_level: Number(reorder_level),
            ...(mrp ? { mrp: Number(mrp) } : null),
            ...(photo ? { photo: `${dbName}/${photo}` } : null),
            product_type
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
        if (photo) await deleteFile(photo, dbName);
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const bulkProductCreationFromFile = asyncHandler(async (req, res) => {
    // console.log(req.body); return    

    const { Product, Brand } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const workBook = new ExcelJS.Workbook();
        await workBook.xlsx.load(req.file.buffer);

        const sheet = workBook.worksheets[0];
        const validateEntries = [];

        const firstRow = sheet.getRow(1);
        const type = firstRow.getCell(1).value?.split(":")?.[1]?.trim().toLowerCase();

        /** extract all data from sheet */
        sheet.eachRow((row, idx) => {
            if (idx === 1 || idx === 2) return;

            validateEntries.push({
                productName: row.getCell(1).value,
                barcode: row.getCell(2).value,
                sku: row.getCell(3).value,
                measure: row.getCell(4).value,
                unitType: row.getCell(5).value,
                packType: row.getCell(6).value,
                brand: row.getCell(7).value,
                hsn: row.getCell(8).value,
                rate: row.getCell(9).value,
                ...(type == "finished" && { mrp: row.getCell(10).value }),
                expDays: row.getCell(11).value,
                minQty: row.getCell(12).value
            })
        });

        await insertBulkUnitType(req.dbModels, validateEntries, transaction);   // unitType
        await insertBulkPackType(req.dbModels, validateEntries, transaction);   // packageType
        await insertBulkBrand(req.dbModels, validateEntries, transaction);      // brand
        await insertBulkHsn(req.dbModels, validateEntries, transaction);        // hsn

        for (const product of validateEntries) {
            const { productName, barcode, sku, measure, unitType, packType, brand, hsn, expDays, minQty, mrp } = product;

            const hasExpiry = expDays !== null ? true : false;
            const brandName = await Brand.findOne({
                where: {
                    name: { [Op.iLike]: brand }
                },
                transaction
            });

            await Product.create({
                name: productName.trim(),
                ...(hsn && { hsn_code: hsn }),
                sku,
                barcode,
                ...(brand && { brand_id: brandName?.id || null }),
                has_expiry: hasExpiry,
                ...(hasExpiry && { shelf_life: Number(expDays) }),
                package_type: packType,
                measure,
                unit_type: unitType,
                reorder_level: Number(minQty),
                ...(mrp ? { mrp: Number(mrp) } : null),
                product_type: type
            }, { transaction });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Finished Product added successfully.", data: { validateEntries } });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const importProducts = asyncHandler(async (req, res) => {
    const transaction = await req.dbObject.transaction();
    const { Product } = req.dbModels;

    // console.log(req.body); return

    try {
        const products = req.body;

        for (const product of products) {
            /** check if product already exists */
            const existingProduct = await Product.findOne({
                where: {
                    name: { [Op.iLike]: product.name },
                    barcode: product.barcode,
                    sku: product.sku,
                }
            });
            if (existingProduct) continue;

            const categoryIds = await addCategory(req.dbModels, transaction, product);
            const brand = await addBrand(req.dbModels, transaction, product?.brand);
            const hsn = await addHsn(req.dbModels, transaction, product?.hsn);
            const packType = await addPackageType(req.dbModels, transaction, product.package_type);
            const unitType = await addUnitType(req.dbModels, transaction, product.unit_type);

            const newProduct = await Product.create({
                ...product,
                ...(brand && { brand_id: brand.id }),
                ...(hsn && { hsn_id: hsn.id }),
                ...(packType && { package_type: packType.name }),
                ...(unitType && { unit_type: unitType.name }),
                has_expiry: product?.has_expiry,
                ...(product?.has_expiry && { shelf_life: Number(product?.shelf_life) })
            }, { transaction });

            if (categoryIds && categoryIds.length > 0) {
                await newProduct.addProductCategories(categoryIds, { transaction });
            }
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Products import successfully." });
    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



/** depricated */
export const createRawProduct = asyncHandler(async (req, res) => {
    // console.log(req.body); return

    const { Product, UnitType } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers['x-tenant-id'];
    let photo = req?.file?.filename || null;

    try {
        let { name = "", unit_type_id = "", description = "", reorder_level = "", barcode = "", sku = "", has_expiry = false, shelf_life = "" } = req.body;

        if ([name, unit_type_id].some(item => item === "")) {
            if (photo) await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        const unitType = await UnitType.findByPk(Number(unit_type_id));
        if (!unitType) {
            if (photo) await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Unit Type not found!!!" });
        };

        const isExists = await Product.findOne({
            where: {
                unit_type: unitType.name,
                name: { [Op.iLike]: name.trim() },
                product_type: "raw",
                ...(sku ? { sku } : { sku: null })
            }
        })
        if (isExists) {
            if (photo) await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `Product already exists!!!` });
        };

        const hasExpiryBool = has_expiry === "true" || has_expiry === true;

        if (hasExpiryBool && !shelf_life) {
            if (photo) await deleteFile(photo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Shelf life is required!!!" });
        }

        const product = await Product.create({
            name: name?.trim(),
            sku,
            ...(barcode?.trim() && { barcode: barcode.trim() }),
            unit_type: unitType.name,
            description,
            reorder_level: Number(reorder_level),
            has_expiry: hasExpiryBool,
            ...(hasExpiryBool && { shelf_life: Number(shelf_life) }),
            product_type: "raw",
            ...(photo ? { photo: `${dbName}/${photo}` } : null)
        }, { transaction });

        if (!product) throw new Error("Insertion failed!!!");
        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(product)));


        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Raw Product added" });

    } catch (error) {
        await transaction.rollback();
        if (photo) await deleteFile(photo, dbName);
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
            await deleteFile(product.photo);
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
            description = "", reorder_level = "", is_active = "", mrp = ""
        } = req.body;

        if (!(id || barcode)) {
            if (profile_image) await deleteFile(profile_image, dbName);
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
            if (profile_image) await deleteFile(profile_image, dbName);
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
                if (profile_image) await deleteFile(profile_image, dbName);
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
                if (profile_image) await deleteFile(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Some brands were not found!!!" });
            };
            product.brand_id = brand.id;
        }
        if (hsn_id) {
            const hsn = await HSN.findByPk(Number(hsn_id));
            if (!hsn) {
                if (profile_image) await deleteFile(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "HSN code not found!!!" });
            };
            product.hsn_id = hsn.id;
        }
        if (sku) product.sku = sku;
        if (package_type_id) {
            const packageType = await PackageType.findByPk(Number(package_type_id));
            if (!packageType) {
                if (profile_image) await deleteFile(profile_image, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "PackageType not found!!!" });
            };
            product.package_type = packageType.name;
        }
        if (unit_type_id) {
            const unitType = await UnitType.findByPk(Number(unit_type_id));
            if (!unitType) {
                if (profile_image) await deleteFile(profile_image, dbName);
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
                await deleteFile(product.photo);
            }
            product.photo = `${dbName}/${profile_image}`;
        }
        if (has_expiry !== "") {
            if (has_expiry === "true" && !shelf_life) {
                if (profile_image) await deleteFile(profile_image, dbName);
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
        if (mrp) product.mrp = Number(mrp);

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

// PUT -- not in use -- 
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



/**
 * @param {Object} models DB model
 * @param {Object} product product fetched data from DB
 */
async function getCategory(models, product) {
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

async function addTotalStock(req, product) {
    const { Batch } = req.dbModels;
    try {

        const user = await getUserContext(req);

        const productIds = product.rows.map(p => p.id);
        const batchDetails = await Batch.findAll({
            where: {
                product_id: {
                    [Op.in]: productIds
                },
                is_active: true,
                location_id: user?.activeNode?.id,
                ...(user?.activeNode?.NodeUser?.store_id !== null && { store_id: user?.activeNode?.NodeUser?.store_id }),
            },
            attributes: ["product_id", "available_qty"],
        });

        const stockByProduct = {};
        batchDetails.forEach(batch => {
            if (!stockByProduct[batch.product_id]) {
                stockByProduct[batch.product_id] = 0;
            }
            stockByProduct[batch.product_id] += Number(batch.available_qty) || 0;
        });

        product.rows.forEach(prod => {
            prod.dataValues.total_stock = stockByProduct[prod.id] || 0;
        });

    } catch (error) {
        throw error;
    }
}


async function addCategory(model, transaction, data) {
    try {
        if (!data || !data.productCategories) return;
        const { Category } = model;

        const categoryIds = [];
        for (const cat of data.productCategories) {
            const [category, _] = await Category.findOrCreate({
                where: {
                    name: { [Op.iLike]: cat.name }
                },
                defaults: {
                    name: cat.name,
                    description: cat.description,
                },
                transaction
            });

            if (cat?.subcategories && cat?.subcategories.length > 0) {
                for (const subCat of cat.subcategories) {
                    const [subCategory, _] = await Category.findOrCreate({
                        where: {
                            name: { [Op.iLike]: subCat.name }
                        },
                        defaults: {
                            name: subCat.name,
                            description: subCat.description,
                            parent_id: category.id
                        },
                        transaction
                    });
                    categoryIds.push(subCategory.id);
                }
            };
            categoryIds.push(category.id);
        };

        console.log("categoryIds", categoryIds)

        return categoryIds;
    } catch (error) {
        throw error
    }
};
async function addHsn(model, transaction, data) {
    try {
        if (!data || !data.hsn_code) return;

        const { HSN } = model;

        const [hsn, _] = await HSN.findOrCreate({
            where: {
                hsn_code: data.hsn_code
            },
            defaults: {
                hsn_code: data.hsn_code,
                default_gst_rate: data.default_gst_rate,
                description: data.description,
                is_exempt: Boolean(data.is_exempt),
            },
            transaction
        });

        return hsn;

    } catch (error) {
        throw error
    }
};
async function addBrand(model, transaction, data) {
    try {
        if (!data || !data.name) return;

        const { Brand } = model;

        const [brand, _] = await Brand.findOrCreate({
            where: {
                slug: data.slug
            },
            defaults: {
                name: data.name,
                description: data.description,
                slug: data.slug,
            },
            transaction
        });

        return brand;

    } catch (error) {
        throw error
    }
};
async function addUnitType(model, transaction, name) {
    try {
        if (!name) return;

        const { UnitType } = model;

        const [unitType, _] = await UnitType.findOrCreate({
            where: {
                name: { [Op.iLike]: name }
            },
            defaults: {
                name,
            },
            transaction
        });

        return unitType;

    } catch (error) {
        throw error
    }
};
async function addPackageType(model, transaction, name) {
    try {
        if (!name) return;

        const { PackageType } = model;

        const [packageType, _] = await PackageType.findOrCreate({
            where: {
                name: { [Op.iLike]: name }
            },
            defaults: {
                name,
            },
            transaction
        });

        return packageType;

    } catch (error) {
        throw error
    }
};