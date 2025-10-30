import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/handelImage.js";

const allBrand = asyncHandler(async (req, res) => {
    const { Brand, Vendor } = req.dbModels;

    try {
        let { page = 1, limit = 10, name = "", id = "" } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const brand = await Brand.findAndCountAll({
            where: (barcode || id) ? {
                [Op.or]: [
                    {
                        id: parseInt(id) || null
                    },
                    {
                        name: {
                            [Op.iLike]: `${name}%`
                        }
                    }
                ]
            } : undefined,
            include: [
                {
                    model: Vendor,
                    as: "suppliedBy"
                },
            ],
            limit,
            offset,
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
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ succes: false, code: 500, message: error.message });
    }
});

const createBrand = asyncHandler(async (req, res) => {
    const { Brand, Vendor } = req.dbModels;

    try {
        const { name = "", description = "", website = "", origin_country = "", status = "", vendor_id = "" } = req.body;
        if (!name) return res.status(400).json({ succes: false, code: 400, message: "Name required!!!" });
        const logo = req?.file?.filename;

        let vendor = null;
        if (vendor_id) {
            vendor = await Vendor.findByPk(parseInt(vendor_id, 10));
        };

        const brand = await Brand.create({
            name,
            slug: makeSlug(name),
            description,
            logo,
            website,
            origin_country,
            status,
            vendor_id: vendor.id
        });
        if (!brand) return res.status(501).json({ succes: false, code: 501, message: "Record not created!!!" });

        return res.status(200).json({ succes: true, code: 200, message: "Record created." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ succes: false, code: 500, message: error.message });
    }
});

const updateBrand = asyncHandler(async (req, res) => {
    const { Brand, Vendor } = req.dbModels;

    try {
        const { id = "", name = "", description = "", website = "", origin_country = "", status = "", vendor_id = "" } = req.body;
        if (!id && !barcode) return res.status(400).json({ success: false, code: 400, message: "Id or Barcode required!!!" });
        const logo = req?.file?.filename || null;

        const brand = await Brand.findOne({ where: { id } });
        if (!brand) return res.status(404).json({ success: false, code: 404, message: "Brand not found!!!" });

        if (brand.logo && logo) {
            const isDeleted = await deleteImage(brand.logo);
            if (isDeleted) brand.logo = logo;
        }
        if (name) {
            brand.name = name;
            brand.slug = makeSlug(name);
        }
        if (description) brand.description = description;
        if (website) brand.website = website;
        if (origin_country) brand.origin_country = origin_country;
        if (status) brand.status = status;
        if (vendor_id) {
            const vendor = await Vendor.findByPk(parseInt(vendor_id, 10));
            brand.vendor = vendor.id;
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ succes: false, code: 500, message: error.message });
    }
});

const deleteBrand = asyncHandler(async (req, res) => {
    const { Brand } = req.dbModels;

    try {
        const { id } = req.params;

        const brand = await Brand.findByPk(parseInt(id, 10));
        if (!brand) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        if (brand.logo) {
            await deleteImage(brand.logo);
        }

        const isDeleted = await Brand.destroy({ where: { id } });
        if (!isDeleted) return res.status(501).json({ success: false, code: 501, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ succes: false, code: 500, message: error.message });
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
