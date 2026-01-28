import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/handelImage.js";

const allBrand = asyncHandler(async (req, res) => {
    const { Brand, Supplier } = req.dbModels;

    try {
        let { page = 1, limit = 10, text = "", id = "", noLimt = false } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const brand = await Brand.findAndCountAll({
            distinct: true,
            where: (text || id) ? {
                [Op.or]: [
                    ...(id && Number.isInteger(Number(id))
                        ? [{ id: Number(id) }]
                        : []),
                    ...(text
                        ? [
                            { name: { [Op.iLike]: `${text}%` } },
                            { slug: { [Op.iLike]: `${text}%` } },
                        ]
                        : [])
                ]
            } : undefined,
            include: [
                {
                    model: Supplier,
                    as: "suppliers",
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                },
            ],
            ...(noLimt ? {} : { limit, offset }),
            order: [["createdAt", "ASC"]],
        });
        if (!brand) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = brand.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: brand.rows,
            ...(!noLimt && {
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            }),
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const createBrand = asyncHandler(async (req, res) => {
    // console.log(req.body); return
    const { Brand, Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers['x-tenant-id'];
    const logo = req?.file?.filename || null;

    try {
        let { name = "", description = "", website = "", origin_country = "", status = "", suppliers = "" } = req.body;
        if (!name || !suppliers) {
            await deleteImage(logo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Name & supplier both are required!!!" });
        }
        suppliers = JSON.parse(suppliers);

        const existingSuppliers = await Supplier.findAll({
            where: {
                id: { [Op.in]: suppliers },
            }, transaction
        });
        if (existingSuppliers.length !== suppliers.length) {
            await deleteImage(logo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Some Suppliers were not found!!!" });
        }

        const brand = await Brand.create({
            name,
            slug: makeSlug(name),
            description,
            logo: logo ? `${dbName}/${logo}` : null,
            website,
            origin_country,
            status,
        }, { transaction });
        if (!brand) throw new Error("Record not created!!!");

        // console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(brand)));
        await brand.addSuppliers(existingSuppliers, { transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record created" });

    } catch (error) {
        await transaction.rollback();
        await deleteImage(logo, dbName);
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateBrand = asyncHandler(async (req, res) => {
    const { Brand, Supplier } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    const dbName = req.headers["x-tenant-id"];
    const logo = req?.file?.filename || null;

    try {
        let { id = "", name = "", description = "", website = "", origin_country = "", status = "", suppliers = "" } = req.body;
        if (!id) {
            if (logo) await deleteImage(logo, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id required!!!" });
        }

        suppliers = JSON.parse(suppliers);

        const brand = await Brand.findOne({ where: { id: parseInt(id, 10) } });
        if (!brand) {
            if (logo) await deleteImage(logo, dbName);
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Brand not found!!!" });
        }

        if (brand.logo && logo) {
            const isDeleted = await deleteImage(brand.logo);
            if (isDeleted) brand.logo = `${dbName}/${logo}`;
        }
        if (name) {
            brand.name = name;
            brand.slug = makeSlug(name);
        }
        if (description) brand.description = description;
        if (website) brand.website = website;
        if (origin_country) brand.origin_country = origin_country;
        if (status) brand.status = status;
        if (suppliers.length > 0) {
            const newSuppliers = await Supplier.findAll({
                where: {
                    id: { [Op.in]: suppliers }
                }, transaction
            });
            if (newSuppliers.length !== suppliers.length) {
                await deleteImage(logo, dbName);
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Some Suppliers were not found!!!" });
            }
            brand.setSuppliers(newSuppliers, { transaction });
        }
        const isUpdate = await brand.save({ transaction });
        if (!isUpdate) throw new Error("Updation failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record Updated Successfully" });

    } catch (error) {
        if (logo) await deleteImage(logo, dbName);
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteBrand = asyncHandler(async (req, res) => {
    const { Brand } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id } = req.params;

        const brand = await Brand.findByPk(parseInt(id, 10));
        if (!brand) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        }

        const isDeleted = await Brand.destroy({ where: { id } }, { transaction });
        if (!isDeleted) throw new Error("Deletion failed!!!");

        if (brand.logo) await deleteImage(brand.logo);
        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        await transaction.commit();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allBrand, createBrand, updateBrand, deleteBrand };

// helper method
function makeSlug(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')   // replace spaces/special chars with -
        .replace(/(^-|-$)/g, '');      // remove leading/trailing hyphens
}
