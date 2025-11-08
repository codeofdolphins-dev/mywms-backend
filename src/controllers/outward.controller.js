import { rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Op } from "sequelize";
const { models } = await rootDB();
const { Vehicle, Driver } = models;


const allOutward = asyncHandler(async (req, res) => {
    const { Outward, OutwardItems, Warehouse, User, Product, Batch } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", outward_ref = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const outward = await Outward.findAndCountAll({
            where: (id || outward_ref) ? { [Op.or]: [{ id: parseInt(id, 10) || null }, { outward_ref }] } : undefined,
            include: [
                {
                    model: OutwardItems,
                    as: "outwardItems",
                    include: [
                        {
                            model: Product,
                            as: "outwardProduct"
                        },
                        {
                            model: Batch,
                            as: "outwardBatch"
                        }
                    ]
                },
                { model: Warehouse, as: "hostWarehouse" },
                { model: Warehouse, as: "targetWarehouse" },
                { model: User, as: "outwardBy" }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]]
        });
        if (!outward) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = outward.count;
        const totalPages = Math.ceil(totalItems / limit);

        const data = outward.rows;

        await Promise.all(data.map(async (item) => {
            const vehicle = await Vehicle.findByPk(item.vehicle_id, {
                attributes: {
                    exclude: ["owned_by", "createdAt", "updatedAt"]
                }
            });
            const driver = await Driver.findByPk(item.driver_id, {
                attributes: {
                    exclude: ["owned_by", "createdAt", "updatedAt"]
                }
            });

            item.dataValues.vehicle = vehicle || null;
            item.dataValues.driver = driver || null;
        }));

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: data.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.log(error);
        req.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const createOutward = asyncHandler(async (req, res) => {
    const { Outward, Warehouse, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { host_warehouse_id = "", target_warehouse_id = "", outward_date = "", outward_type = "", vehicle_id = "", driver_id = "", status = "", note = "", items = [] } = req.body;
        const userDetails = req.user;
        let total = 0;
        if ([host_warehouse_id, outward_date, vehicle_id, driver_id].some(i => i === "")) {
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
        const outward = await Outward.create({
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

            total += (item.qty * item.rate);

            await fifoOutward({
                outward_id: outward.id,
                product_id: product.id,
                warehouse_id: parseInt(host_warehouse_id, 10),
                outward_qty: parseInt(item.qty, 10),
                uom,
                rate: parseFloat(rate),
                transaction,
                req
            });
        }

        // Step 3: Update status
        outward.status = "dispatched";
        outward.total = total;
        await outward.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Outward Successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const deleteOutward = asyncHandler(async (req, res) => {
    const { Outward } = req.dbModels;
    try {
        const { id = "", outward_ref = "" } = req.params;
        if (!(id || outward_ref)) return res.status(400).json({ success: false, code: 400, message: "id or outward_ref is required!!!" });

        const [isDeleted] = await Outward.destroy({ where: { [Op.or]: [{ id: parseInt(id, 10) || null }, { outward_ref }] } });
        if (isDeleted) return res.status(500).json({ success: false, code: 500, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });
    } catch (error) {
        console.log(error);
        await ransaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateOutward = asyncHandler(async (req, res) => {
    const { Outward, Warehouse } = req.dbModels;
    try {
        const { id = "", outward_ref = "", host_warehouse_id = "", target_warehouse_id = "", outward_date = "", outward_type = "", vehicle_id = "", driver_id = "", status = "", note = "" } = req.body;
        if (!(id || outward_ref)) return res.status(400).json({ success: false, code: 400, message: "id or outward_ref is required!!!" });

        const isExiste = await Outward.findOne({ where: { [Op.or]: [{ id: parseInt(id, 10) || null }, { outward_ref }] } });
        if (!isExiste) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        let updateOption = {};
        if (outward_date) updateOption.outward_date = new Date(outward_date);
        if (outward_type) updateOption.outward_type = outward_type.toLowercase();
        if (status) updateOption.status = status.toLowercase();
        if (note) updateOption.note = note.toLowercase();
        if (host_warehouse_id) {
            const hostWarehouse = await Warehouse.findByPk(parseInt(host_warehouse_id, 10));
            if (!hostWarehouse) return res.status(404).json({ success: false, code: 404, message: "Host Warehouse record not found!!!" });
            updateOption.host_warehouse_id = hostWarehouse.id;
        }
        if (target_warehouse_id) {
            const targetWarehouse = await Warehouse.findByPk(parseInt(target_warehouse_id, 10));
            if (!targetWarehouse) return res.status(404).json({ success: false, code: 404, message: "Target Warehouse record not found!!!" });
            updateOption.target_warehouse_id = targetWarehouse.id;
        }
        if (vehicle_id) {
            const vehicle = await Vehicle.findByPk(parseInt(vehicle_id, 10));
            if (!vehicle) return res.status(404).json({ success: false, code: 404, message: "Vehicle not found!!!" });
            updateOption.vehicle_id = vehicle.id;
        };
        if (driver_id) {
            const driver = await Driver.findByPk(parseInt(driver_id, 10));
            if (!driver) return res.status(404).json({ success: false, code: 404, message: "Driver not found!!!" });
            updateOption.driver_id = driver.id;
        };

        const { isUpdate } = await Outward.update(
            updateOption,
            {
                where: { [Op.or]: [ { id: parseInt(id, 10) || null }, { outward_ref } ] }
            }
        );
        if(!isUpdate) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Update successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateOutwardItem = asyncHandler(async (req, res) => {
    const { Outward, OutwardItems, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id = "", barcode = "", qty = "", uom = "", rate = "" } = req.body;
        if(!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const outwardItem = await OutwardItems.findByPk(parseInt(id, 10));
        if(!outwardItem) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        const outward = await Outward.findByPk(outwardItem.outward_id);
        if(!outward) return res.status(404).json({ success: false, code: 404, message: "Something wrong, parent record not found!!!" });

        let newQty = parseInt(qty, 10) || outwardItem.qty;
        let newUom = uom || outwardItem.uom;
        let newRate = parseInt(rate, 10) || outwardItem.rate;
        let newTotal = newQty * newRate;
        let old_total_amount = outwardItem.total_amount

        let updateOption = {
            qty: newQty,
            uom: newUom,
            rate: newRate,
            total_amount: newTotal
        };
        if(barcode){
            const product = await Product.findOne({ where: { barcode } });
            if(!product) return res.status(404).json({ success: false, code: 404, message: "Product record not found!!!" });
            updateOption.barcode = barcode;
        };

        await OutwardItems.update(
            updateOption,
            {
                where: { id: parseInt(id, 10) },
                transaction
            }
        );

        outward.total = (outward.total - old_total_amount) + newTotal;
        await outward.save({ transaction });

        return res.status(200).json({ success: true, code: 200, message: "Outward item record updated successfully." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { allOutward, createOutward, deleteOutward, updateOutward, updateOutwardItem };

// ****************** helper methods **********************
async function fifoOutward({
    product_id,
    warehouse_id,
    outward_qty,
    outward_id, // id of StockOutward record
    uom,
    rate,
    transaction,  // optional for DB transaction
    req
}) {
    const { Batch, Inventory, OutwardItems } = req.dbModels;

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
        const outwardItem = await OutwardItems.create({
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
        await transaction.rollback();
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