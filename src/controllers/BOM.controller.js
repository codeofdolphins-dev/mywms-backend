import { asyncHandler } from "../utils/asyncHandler.js";


// GET
const allBOMList = asyncHandler(async (req, res) => {
  const { BillOfMaterial, Product } = req.dbModels;

  try {
    let { page = 1, limit = 10, id = "" } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    // Fetch all BOM records
    const records = await BillOfMaterial.findAll({
      where: id ? { finished_product_id: parseInt(id, 10) } : undefined,
      include: [
        { model: Product, as: "finishedProduct" },
        { model: Product, as: "rawMaterial" },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Group by finished_product_id
    const grouped = {};

    for (const record of records) {
      const fp = record.finishedProduct;
      const rp = record.rawMaterial;     

      if (!grouped[record.finished_product_id]) {
        grouped[record.finished_product_id] = {
          finished_product_id: record.finished_product_id,
          finished_product_name: fp?.name || null,
          finished_product_sku: fp?.sku || null,
          finished_product_barcode: fp?.barcode || null,
          rawMaterials: [],
        };
      }

      grouped[record.finished_product_id].rawMaterials.push({
        raw_product_id: record.raw_product_id,
        raw_product_name: rp?.name || null,
        raw_product_sku: rp?.sku || null,
        raw_product_barcode: rp?.barcode || null,
        quantity_required: record.quantity_required,
        uom: record.uom,
      });
    }

    // Convert to array and paginate
    const groupedArray = Object.values(grouped);
    const totalItems = groupedArray.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginated = groupedArray.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      code: 200,
      message: "Fetched Successfully.",
      data: paginated.rows,
      meta: {
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
const createBOM = asyncHandler(async (req, res) => {
    const { BillOfMaterial, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { finished_product_barcode = "", items = [] } = req.body;
        if (!finished_product_barcode) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Finished Product barcode required!!!" });
        }
        if (items.length < 1) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "items should not be empty!!!" });
        }

        const product = await Product.findOne({ where: { barcode: parseInt(finished_product_barcode, 10) } });
        if (!product) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: `Product with barcode: ${finished_product_barcode} is not found!!!` });
        }

        for (const item of items) {
            const rawProduct = await Product.findOne({ where: { barcode: parseInt(item.raw_product_barcode, 10) } });
            if (!rawProduct) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: `Product with barcode: ${item.raw_product_barcode} not found!!!` });
            }

            const isCreate = await BillOfMaterial.create({
                finished_product_id: product.id,
                raw_product_id: rawProduct.id,
                quantity_required: parseFloat(item.qty),
                uom: item.uom
            }, { transaction });
            if (!isCreate) {
                await transaction.rollback();
                return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });
            }
        }

        product.product_type = "finished";
        product.save({ transaction });

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



export { allBOMList, createBOM, addItem, deleteBOM, removeItem, updateBOM };