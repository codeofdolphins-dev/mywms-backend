import { asyncHandler } from "../utils/asyncHandler.js";


// GET
export const allBOMList = asyncHandler(async (req, res) => {
    const { BOM, BOMItem, Product } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", barcode = "", noLimit = false } = req.query;

        page = Number(page);
        limit = Number(limit);
        const offset = (page - 1) * limit;

        // Fetch all BOM records
        const records = await BOM.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(barcode && { finished_product_barcode: barcode }),
            },
            include: [
                {
                    model: BOMItem,
                    as: "bomItems",
                    include: [
                        {
                            model: Product,
                            as: "rawProduct"
                        },
                    ]
                },
                {
                    model: Product,
                    as: "finishedProduct"
                }
            ],
            order: [["createdAt", "ASC"]],
            ...(noLimit ? {} : { limit, offset }),
        });

        const totalItems = records.count;
        const totalPages = Math.ceil(totalItems / limit);


        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: records.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createBOM = asyncHandler(async (req, res) => {
    const { BOM, BOMItem, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { finished_product_barcode = "", output_qty = "", desc = "", items = [] } = req.body;

        if (!finished_product_barcode || !output_qty) throw new Error("Required fields are missing!!!");
        if (items.length == 0) throw new Error("items should not be empty!!!");


        const product = await Product.findOne({ where: { barcode: finished_product_barcode } });
        if (!product) throw new Error(`Product with barcode: ${finished_product_barcode} is not found!!!`);

        const existingBOM = await BOM.findOne({ where: { finished_product_id: product.id } });
        if (existingBOM) throw new Error(`BOM already exists for product with barcode: ${finished_product_barcode}!!!`);

        const bom = await BOM.create({
            finished_product_id: product.id,
            finished_product_barcode: finished_product_barcode,
            output_qty: parseFloat(output_qty),
            output_uom: product.unit_type,
            desc
        }, { transaction });

        if (!bom) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });
        }

        for (const item of items) {
            const { raw_product_id = "", required_qty = "" } = item;
            if (!raw_product_id || !required_qty) throw new Error("Required fields are missing in items!!!");

            const rawProduct = await Product.findByPk(Number(raw_product_id));
            if (!rawProduct) throw new Error(`Raw product not found!!!`);

            const bomItem = await BOMItem.create({
                bom_id: bom.id,
                raw_product_id: rawProduct.id,
                required_qty: parseFloat(required_qty),
                uom: rawProduct.unit_type,
            }, { transaction });

            if (!bomItem) {
                await transaction.rollback();
                return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });
            }
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record created successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



// PUT
const addItem = asyncHandler(async (req, res) => {
    const { BillOfMaterial, Product } = req.dbModels;

    try {
        const { id = "", raw_product_barcode = "", qty = "", uom = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const bom = await BillOfMaterial.findOne({ where: { id: parseInt(id, 10) || null } });
        if (!bom) return res.status(404).json({ success: false, code: 404, message: "Bill Of Material record not found!!!" });

        const product = await Product.findOne({ where: { barcode: parseInt(raw_product_barcode, 10) || null } })
        if (!product) return res.status(404).json({ success: false, code: 404, message: "Product record not found!!!" });

        const itemAdded = await BillOfMaterial.create({
            finished_product_id: bom.finished_product_id,
            raw_product_id: product.id,
            quantity_required: parseFloat(qty) || null,
            uom
        });
        if (!itemAdded) return res.status(501).json({ success: false, code: 501, message: "Item not added!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Item added successfully!!!" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateBOM = asyncHandler(async (req, res) => {
    const { BillOfMaterial, Product } = req.dbModels;

    try {
        const { id = "", raw_product_barcode = "", qty = "", uom = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "id must be required!!!" });

        const billOfMaterial = await BillOfMaterial.findByPk(parseInt(id, 10));
        if (!billOfMaterial) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        let updateDetails = {};
        if (raw_product_barcode) {
            const rawProduct = await Product.findOne({ where: { barcode: parseInt(raw_product_barcode, 10) } });
            if (!rawProduct) return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            updateDetails.raw_product_id = rawProduct.id;
        };
        if (qty) updateDetails.quantity_required = parseFloat(qty);
        if (uom) updateDetails.uom = uom;

        const [isUpdate] = await BillOfMaterial.update(
            updateDetails,
            {
                where: { id: billOfMaterial.id }
            }
        );
        if (!isUpdate) return res.status(501).json({ success: false, code: 501, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Updated successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteBOM = asyncHandler(async (req, res) => {
    const { BillOfMaterial } = req.dbModels;

    try {
        const { id } = req.rarams;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const billOfMaterial = await BillOfMaterial.findByPk(parseInt(id, 10));
        if (!billOfMaterial) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        const isDeleted = await Product.destroy({
            where: {
                finished_product_id: billOfMaterial.finished_product_id
            }
        });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const removeItem = asyncHandler(async (req, res) => {
    const { BillOfMaterial } = req.dbModels;

    try {
        const { id = "", finished_product_id = "" } = req.query;
        if (!(id && finished_product_id)) return res.status(400).json({ success: false, code: 400, message: "Both fields are required!!!" });

        const item = await BillOfMaterial.findOne({
            where: {
                id: parseInt(id, 10) || null,
                finished_product_id: parseInt(finished_product_id, 10) || null
            }
        })
        if (!item) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        const isDeleted = await BillOfMaterial.destroy({
            where: {
                id: parseInt(id, 10) || null,
                finished_product_id: parseInt(finished_product_id, 10) || null
            }
        });
        if (!isDeleted) return res.status(501).json({ success: false, code: 501, message: "Record not deleted!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Record deleted successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});