import { rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const { models } = await rootDB();
const { Vehicle, Driver } = models;


// GET
const getInward = asyncHandler(async (req, res) => {
    const { Inward, InwardItem, PurchasOrder, Vendor, Invoice, User } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const stockInward = await Inward.findAndCountAll({
            where: id ? { id: parseInt(id) } : undefined,
            include: [
                { model: PurchasOrder, as: "poReference" },
                { model: Vendor, as: "stockVendor" },
                { model: Invoice, as: "purchaseInvoice" },
                { model: User, as: "inwardBy" },
                { model: InwardItem, as: "items" }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]]
        });
        if (!stockInward) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = stockInward.count;
        const totalPages = Math.ceil(totalItems / limit);

        const data = stockInward.rows;

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
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const createInward = asyncHandler(async (req, res) => {
    const { Inward, InwardItem, PurchasOrder, Product, Batch, Vendor, Warehouse, Inventory } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { po_id = "", warehouse_id = "", vendor_id = "", challan_no = "", invoice = "", t_pass_no = "", vehicle_id = "", driver_id = "", status = "", note = "", items = [] } = req.body;
        const userDetails = req.user;

        if ([po_id, vendor_id, vehicle_id, driver_id, warehouse_id].some(item => item === "")) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required field missing!!!" });
        }
        if (items.length == 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "items should not empty!!!" });
        }

        const isPurchasOrderExists = await PurchasOrder.findByPk(po_id, { transaction });
        if (!isPurchasOrderExists) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "No Purchase order record found!!!" });
        }
        const isVendorExists = await Vendor.findByPk(vendor_id, { transaction });
        if (!isVendorExists) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Vendor not found!!!" });
        }
        const vehicleExists = await Vehicle.findByPk(vehicle_id);
        if (!vehicleExists) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Vehicle not found!!!" });
        }
        const driverExists = await Driver.findByPk(driver_id);
        if (!driverExists) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Driver not found!!!" });
        }
        const warehouseExists = await Warehouse.findByPk(warehouse_id, { transaction });
        if (!warehouseExists) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Warehouse not found!!!" });
        }

        const stockInward = await Inward.create({
            po_id: parseInt(po_id, 10),
            vendor_id: parseInt(vendor_id, 10),
            inward_by: userDetails.id,
            warehouse_id,
            challan_no,
            transport_pass_no: t_pass_no,
            vehicle_id: parseInt(vehicle_id, 10),
            driver_id: parseInt(driver_id, 10),
            status: status === "" ? undefined : status.toLowerCase(),
            note
        }, { transaction });

        for (const item of items) {
            const product = await Product.findOne({
                where: {
                    barcode: parseInt(item.barcode)
                },
                transaction
            });
            if (!product) {
                await transaction.rollback();
                return res.status(200).json({ success: true, code: 200, message: `Product with barcode: ${item.barcode} not found` });
            };

            const totalQty = parseInt(item.qty, 10) - (parseInt(item.d_qty, 10) + parseInt(item.s_qty, 10));
            if (totalQty <= 0) {
                await transaction.rollback();
                return res.status(422).json({ success: false, code: 422, message: 'Invalid quentity entered!!!' });
            };
            const totalCost = totalQty * parseInt(item.unit_cost, 10);

            await InwardItem.create({
                stock_inward_id: stockInward.id,
                product_id: product.id,
                quantity: totalQty,
                damage_qty: item.d_qty,
                shortage_qty: item.s_qty,
                total_cost: totalCost,
                ...item
            }, { transaction });


            const inventory = await Inventory.findOne({
                where: {
                    warehouse_id,
                    product_id: product.id,
                }, transaction
            });
            if (!inventory) {
                const inventory = await Inventory.create({
                    product_id: product.id,
                    warehouse_id,
                    available_qty: totalQty,
                    last_inward_id: stockInward.id,
                }, { transaction });

                await Batch.create({
                    product_id: product.id,
                    inventory_id: inventory.id,
                    warehouse_id,
                    batch_number: item.batch_no,
                    expiry_date: item.e_date === "" ? undefined : new Date(item.e_date),
                    qty: totalQty,
                    cost_price: parseInt(item.unit_cost, 10)
                }, { transaction });

            } else {
                const batch = await Batch.findOne({
                    where: {
                        warehouse_id,
                        product_id: product.id,
                        batch_number: item.batch_no,
                    }, transaction
                });
                if (batch) {
                    const extendQty = batch.qty + totalQty;
                    await Batch.update(
                        { qty: extendQty },
                        { where: { id: batch.id }, transaction }
                    );
                } else {
                    await Batch.create({
                        product_id: product.id,
                        batch_number: item.batch_no,
                        expiry_date: item.e_date === "" ? undefined : new Date(item.e_date),
                        qty: totalQty,
                        cost_price: parseInt(item.unit_cost, 10)
                    }, { transaction })
                }

                // increse inventory qty
                await Inventory.update(
                    { available_qty: inventory.available_qty + totalQty },
                    {
                        where: {
                            warehouse_id,
                            product_id: product.id,
                        }, transaction
                    }
                );
            }
        };

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Inward Successfull." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteInward = asyncHandler(async (req, res) => {
    const { Inward } = req.dbModels;
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "id required!!!" });

        const isDeleted = await Inward.destroy({ where: { id } });
        if (!isDeleted) return res.status(500).json({ success: false, code: 500, message: "Delete failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateInward = asyncHandler(async (req, res) => {
    const { Inward, Vendor, Invoice } = req.dbModels;
    try {
        const { id = "", vendor_id = "", challan_no = "", invoice = "", t_pass_no = "", vehicle_id = "", driver_id = "", status = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const isStockInwardExists = await Inward.findByPk(id);
        if (!isStockInwardExists) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        let updateDetails = {};
        if (challan_no) updateDetails.challan_no = challan_no;
        if (t_pass_no) updateDetails.t_pass_no = t_pass_no;
        if (status) updateDetails.status = status.toLowerCase();
        if (note) updateDetails.note = note;
        if (vendor_id) {
            const isExists = await Vendor.findByPk(vendor_id);
            if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Vendor not found!!!" });
            updateDetails.vendor_id = parseInt(vendor_id, 10);
        }
        if (invoice) {
            const isExists = await Invoice.findOne({ invoice_number: invoice });
            if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Invoice not found!!!" });
            updateDetails.invoice_id = isExists.id;
        }
        if (vehicle_id) {
            const isExists = await Vehicle.findByPk(vehicle_id);
            if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Vehicle not found!!!" });
            updateDetails.vehicle_id = parseInt(vehicle_id, 10);
        }
        if (driver_id) {
            const isExists = await Driver.findByPk(driver_id);
            if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Driver not found!!!" });
            updateDetails.driver_id = parseInt(driver_id, 10);
        }

        const isUpdate = await Inward.update(
            updateDetails,
            { where: { id } }
        );
        if (!isUpdate) return res.status(404).json({ success: false, code: 404, message: "Inward updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Inward updated successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateInwardItems = asyncHandler(async (req, res) => {
    const { InwardItem, Batch, Product, Inventory } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id = "", barcode = "", unit_cost = "", qty = "", d_qty = "0", s_qty = "0", e_date = "", warehouse_id = "" } = req.body;
        if (!id || !warehouse_id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "id and warehouse id Both fields are required!!!" });
        }

        const stockInwardItem = await InwardItem.findByPk(id);
        if (!stockInwardItem) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        }

        // Start with existing values
        let newUnitCost = unit_cost || stockInwardItem.unit_cost;
        let newQty = qty || stockInwardItem.quantity;
        let newDamageQty = d_qty || stockInwardItem.damage_qty || 0;
        let newShortageQty = s_qty || stockInwardItem.shortage_qty || 0;

        // Recalculate final quantity
        let finalQty = parseInt(newQty) - (parseInt(newDamageQty) + parseInt(newShortageQty));

        // Build updateDetails object
        let updateDetails = {
            unit_cost: newUnitCost,
            quantity: finalQty,
            total_cost: finalQty * newUnitCost,
            ...(d_qty && { damage_qty: d_qty }),
            ...(s_qty && { shortage_qty: s_qty })
        };
        if (barcode) {
            const isExists = await Product.findOne({ where: { barcode }, transaction });
            if (!isExists) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            }
            updateDetails.product_id = isExists.id;
        }

        const [isUpdated] = await InwardItem.update(
            updateDetails,
            { where: { id }, transaction }
        );
        if (!isUpdated) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Inward items updation failed!!!" });
        }

        const inventory = await Inventory.findOne({
            where: {
                warehouse_id,
                product_id: updateDetails.product_id,
            }, transaction
        });

        const [isInventoryUpdated] = await Inventory.update(
            {
                available_qty: inventory.available_qty - stockInwardItem.quantity + qty
            },
            { where: { id: inventory.id }, transaction }
        );
        if(!isInventoryUpdated){
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Inventory updation failed!!!" });
        }

        const [isUpdate] = await Batch.update(
            {
                product_id: barcode ? updateDetails.product_id : stockInwardItem.product_id,
                expiry_date: e_date,
                qty: finalQty,
                cost_price: newUnitCost
            },
            { where: { batch_number: stockInwardItem.batch_no, product_id: stockInwardItem.product_id }, transaction }
        )
        if (!isUpdate) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Batch updation failed!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Inward items updated successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { getInward, createInward, deleteInward, updateInward, updateInwardItems };