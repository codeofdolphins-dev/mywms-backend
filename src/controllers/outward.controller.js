import { rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Op } from "sequelize";
const { models } = await rootDB();
const { Vehicle, Driver } = models;


export const createOutward = asyncHandler(async (req, res) => {
    const { StockOutward, Warehouse, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { host_warehouse_id = "", target_warehouse_id = "", outward_date = "", outward_type = "", vehicle_id = "", driver_id = "", status = "", note = "", items = [] } = req.body;
        const userDetails = req.user;
        if ([host_warehouse_id, outward_date, vehicle_id, driver_id]) {
            await transaction.rollback()
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };
        if (items.length <= 0) {
            await transaction.rollback()
            return res.status(400).json({ success: false, code: 400, message: "Items fields are should not be empty!!!" });
        };

        const host_warehouse = await Warehouse.findByPk(host_warehouse_id);
        if (!host_warehouse) {
            await transaction.rollback()
            return res.status(404).json({ success: false, code: 404, message: "Host warehouse not found!!!" });
        };
        if (target_warehouse_id) {
            const target_warehouse = await Warehouse.findByPk(target_warehouse_id);
            if (!target_warehouse) {
                await transaction.rollback()
                return res.status(404).json({ success: false, code: 404, message: "Target warehouse not found!!!" });
            }
        };
        const vehicle = await Vehicle.findByPk(vehicle_id);
        if (!vehicle) {
            await transaction.rollback()
            return res.status(404).json({ success: false, code: 404, message: "Vehicle not found!!!" });
        };
        const driver = await Driver.findByPk(driver_id);
        if (!driver) {
            await transaction.rollback()
            return res.status(404).json({ success: false, code: 404, message: "Driver not found!!!" });
        };

        // Step 1: Create Outward header
        const outward = await StockOutward.create({
            host_warehouse_id: parseInt(host_warehouse_id, 10),
            target_warehouse_id: target_warehouse_id === "" ? undefined : parseInt(target_warehouse_id, 10),
            outward_date: new Date(outward_date),
            outward_type: outward_type === "" ? undefined : outward_type.toLowercase(),
            outward_by: userDetails.id,
            vehicle_id: parseInt(vehicle_id, 10),
            driver_id: parseInt(driver_id, 10),
            status: status === "" ? undefined : status.toLowercase(),
            note
        }, { transaction });

        // Step 2: Loop through products and do FIFO deduction
        for (const item of items) {
            const product = await Product.findOne({ where: { barcode: parseInt(item.barcode, 10) } });
            if (!product) {
                await transaction.rollback()
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            };

            await fifoOutward({
                outward_id: outward.id,
                product_id: product.id,
                warehouse_id: parseInt(host_warehouse_id, 10),
                outward_qty: parseInt(item.qty, 10),
                uom,
                rate: parseFloat(rate),
                transaction
            });
        }

        // Step 3: Update status
        outward.status = "Dispatched";
        await outward.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Outward Successfully." });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



// ****************** helper methods **********************
async function fifoOutward({
    product_id,
    warehouse_id,
    outward_qty,
    outward_id, // id of StockOutward record
    uom,
    rate,
    transaction  // optional for DB transaction
}) {
    const { Batch, Inventory, OutwardItem } = req.dbModels;

    // Step 1: fetch batches sorted FIFO (expiry or oldest entry)
    const batches = await Batch.findAll({
        where: {
            product_id,
            warehouse_id,
            qty: { [Op.gt]: 0 }
        },
        order: [['expiry_date', 'ASC'], ['createdAt', 'ASC']],
        transaction
    });

    let remaining = outward_qty;
    let outwardItems = [];

    for (const batch of batches) {
        if (remaining <= 0) break;

        const availableInBatch = batch.qty;
        const deductQty = Math.min(remaining, availableInBatch);

        // Step 2: Deduct from this batch
        batch.qty = availableInBatch - deductQty;
        await batch.save({ transaction });

        // Step 3: Record outward item
        const outwardItem = await OutwardItem.create({
            outward_id,
            product_id,
            batch_id: batch.id,
            qty: deductQty,
            uom,
            rate,
            total_amount: deductQty * rate
        }, { transaction });

        outwardItems.push(outwardItem);

        remaining -= deductQty;
    }

    // Step 4: Check if stock was sufficient
    if (remaining > 0) {
        throw new Error(`Insufficient stock for product_id ${product_id}. Short by ${remaining}`);
    }

    // Step 5: Update inventory total
    const inventory = await Inventory.findOne({
        where: { product_id, warehouse_id },
        transaction
    });
    inventory.available_qty -= outward_qty;
    await inventory.save({ transaction });

    return outwardItems;
};
