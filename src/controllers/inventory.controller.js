import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserContext } from "../utils/getUserContext.js";

// GET
export const inventory = asyncHandler(async (req, res) => {
    const { Batch, Product } = req.dbModels;
    try {

        const userDetails = await getUserContext(req);

        const location_id = req.activeNode;
        const store_id = userDetails?.activeNode?.store?.id;

        // Step 1: Fetch all matching batch product_ids (original logic)
        const product_ids = await Batch.findAll({
            where: {
                location_id,
                ...(store_id && { store_id }),
            },
            attributes: ["product_id"]
        });

        const productIds = [...new Set(product_ids.map((item) => item.product_id))];

        // Pagination params
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;

        // Step 2: Fetch products with pagination
        const { count, rows: products } = await Product.findAndCountAll({
            where: {
                id: { [Op.in]: productIds }
            },
            include: [
                {
                    model: Batch,
                    as: "batches",
                    where: {
                        location_id,
                        ...(store_id && { store_id }),
                        available_qty: { [Op.gt]: 0 },
                        is_active: true
                    }
                }
            ],
            limit,
            offset,
            order: [["id", "ASC"]],
        });

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            success: true,
            data: products,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});