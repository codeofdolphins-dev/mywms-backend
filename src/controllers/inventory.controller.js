import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserContext } from "../utils/getUserContext.js";

// GET
export const inventory_scope = asyncHandler(async (req, res) => {
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

// GET Full List for Admin
export const inventory_full = asyncHandler(async (req, res) => {
    const { Product, Category, Brand, Batch, BusinessNode, ManufacturingUnit, GRN, GRNItem, Outward, OutwardItem } = req.dbModels;

    try {
        // 1. Fetch all products with their categories, brand, and active batches
        const products = await Product.findAll({
            include: [
                {
                    model: Category,
                    as: "productCategories",
                    through: { attributes: [] }
                },
                {
                    model: Brand,
                    as: "brand"
                },
                {
                    model: Batch,
                    as: "batches",
                    where: {
                        is_active: true
                    },
                    required: false,
                    include: [
                        {
                            model: BusinessNode,
                            as: "batchLocation"
                        },
                        {
                            model: ManufacturingUnit,
                            as: "batchStore"
                        }
                    ]
                }
            ],
            order: [["id", "DESC"]]
        });

        // 2. Fetch all GRN items to find last inward dates
        const grnItems = await GRNItem.findAll({
            include: [{
                model: GRN,
                as: "grn",
                where: { status: "accepted" },
                attributes: ["received_date"]
            }],
            attributes: ["product_id"]
        });

        const lastInwardDateMap = new Map();
        grnItems.forEach(item => {
            const prodId = item.product_id;
            const date = item.grn?.received_date;
            if (date) {
                const existing = lastInwardDateMap.get(prodId);
                if (!existing || new Date(date) > new Date(existing)) {
                    lastInwardDateMap.set(prodId, date);
                }
            }
        });

        // 3. Fetch all outward items to find last outward dates
        const outwardItems = await OutwardItem.findAll({
            include: [{
                model: Outward,
                as: "outward",
                where: { status: "dispatched" },
                attributes: ["dispatch_date"]
            }],
            attributes: ["vendor_product_id"]
        });

        const lastOutwardDateMap = new Map();
        outwardItems.forEach(item => {
            const prodId = item.vendor_product_id;
            const date = item.outward?.dispatch_date;
            if (date) {
                const existing = lastOutwardDateMap.get(prodId);
                if (!existing || new Date(date) > new Date(existing)) {
                    lastOutwardDateMap.set(prodId, date);
                }
            }
        });

        // 4. Fetch GRNs for batch reference lookups
        const grnIds = products.flatMap(p => 
            (p.batches || [])
                .filter(b => b.reference_type === "grn" && b.reference_id)
                .map(b => b.reference_id)
        );
        const grns = grnIds.length ? await GRN.findAll({
            where: { id: { [Op.in]: grnIds } },
            attributes: ["id", "grn_no"]
        }) : [];
        const grnMap = new Map(grns.map(g => [g.id, g.grn_no]));

        // 5. Format and construct the final inventory response
        const formattedProducts = products.map(product => {
            const batches = product.batches || [];
            
            const totalQty = batches.reduce((sum, b) => sum + parseFloat(b.available_qty || 0) + parseFloat(b.reserved_qty || 0), 0);
            const availableQty = batches.reduce((sum, b) => sum + parseFloat(b.available_qty || 0), 0);
            const reservedQty = batches.reduce((sum, b) => sum + parseFloat(b.reserved_qty || 0), 0);
            
            const locationNames = [...new Set(batches.map(b => b.location_type === "mfg_unit" ? b.batchStore?.name : b.batchLocation?.name).filter(Boolean))];
            const locationStr = locationNames.join(", ") || "N/A";
            
            const categories = product.productCategories || [];
            const parentCat = categories.find(cat => cat.parent_id === null);
            const childCat = categories.find(cat => cat.parent_id !== null);
            
            const categoryName = parentCat?.name || "N/A";
            const subCategoryName = childCat?.name || "N/A";
            const brandName = product.brand?.name || "N/A";
            
            const productLastInward = lastInwardDateMap.get(product.id) || "N/A";
            const productLastOutward = lastOutwardDateMap.get(product.id) || "N/A";

            // Fallback price logic for raw materials (whose price is set per batch)
            const prices = batches.map(b => parseFloat(b.unit_price || 0)).filter(p => p > 0);
            const fallbackPrice = prices.length ? Math.max(...prices) : 0;
            const unitPrice = parseFloat(product.mrp || 0) || fallbackPrice;
            
            return {
                id: product.id,
                name: product.name,
                sku: product.sku || "N/A",
                barcode: product.barcode || "N/A",
                category: categoryName,
                subCategory: subCategoryName,
                product_type: product.product_type || "N/A",
                brand: brandName,
                location: locationStr,
                totalQty,
                availableQty,
                reservedQty,
                reorderLevel: product.reorder_level || 0,
                unitPrice: unitPrice,
                unit: product.unit_type || "N/A",
                lastInwardDate: productLastInward,
                lastOutwardDate: productLastOutward,
                batches: batches.map(b => {
                    const grnNo = grnMap.get(b.reference_id) || (b.reference_type === "grn" ? `GRN #${b.reference_id}` : "N/A");
                    const storageLocation = b.location_type === "mfg_unit" ? b.batchStore?.name : b.batchLocation?.name;
                    
                    return {
                        batchNo: b.batch_no || "N/A",
                        qty: parseFloat(b.available_qty || 0) + parseFloat(b.reserved_qty || 0),
                        mfgDate: b.mfg_date || "N/A",
                        expiryDate: b.expiry_date || "N/A",
                        grnRef: grnNo,
                        storageLocation: storageLocation || "N/A"
                    };
                })
            };
        });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Admin Inventory fetched successfully.",
            data: formattedProducts
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


