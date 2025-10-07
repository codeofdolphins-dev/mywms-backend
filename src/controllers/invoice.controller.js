import { Op } from "sequelize";
import { rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const { models } = await rootDB();
const { Vehicle, Driver } = models;


// GET
const getInvoice = asyncHandler(async (req, res) => {
    const {  Invoice, InvoiceItems, PurchasOrder, Vendor, User } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", invoice_no = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const invoice = await Invoice.findAndCountAll({
            where: (id || invoice_no) ? { [Op.or]: [ { id: parseInt(id, 10) || null }, { invoice_number: invoice_no } ] } : undefined,
            include: [
                { model: PurchasOrder, as: "invoicePurchasOrder" },
                // { model: Vendor, as: "stockVendor" },
                // { model: Invoice, as: "purchaseInvoice" },
                // { model: User, as: "inwardBy" },
                // { model: StockInwardItem, as: "items" }
            ],
            limit,
            offset,
            order: [["createdAt", "ASC"]]
        });
        if (!invoice) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = invoice.count;
        const totalPages = Math.ceil(totalItems / limit);

        // await Promise.all(data.map(async (item) => {
        //     const vehicle = await Vehicle.findByPk(item.vehicle_id, {
        //         attributes: {
        //             exclude: ["owned_by", "createdAt", "updatedAt"]
        //         }
        //     });
        //     const driver = await Driver.findByPk(item.driver_id, {
        //         attributes: {
        //             exclude: ["owned_by", "createdAt", "updatedAt"]
        //         }
        //     });

        //     item.dataValues.vehicle = vehicle || null;
        //     item.dataValues.driver = driver || null;
        // }));

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: invoice.rows,
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
const createInvoice = asyncHandler(async (req, res) => {
    const { Invoice, InvoiceItems, PurchasOrder, Product, StockInward, Warehouse } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { po_id = "", warehouse_id = "", inward_id = "", invoice_number = "", invoice_date = "", due_date = "", status = "", note = "", items = [] } = req.body;

        if ([po_id, inward_id, warehouse_id, invoice_number].some(item => item === "")) {
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
        const isWarehouseExists = await Warehouse.findByPk(warehouse_id, { transaction });
        if (!isWarehouseExists) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Warehouse not found!!!" });
        }
        const isInwardExists = await StockInward.findByPk(inward_id);
        if (!isInwardExists) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "No Inward record found!!!" });
        }

        const invoice = await Invoice.create({
            po_id: parseInt(po_id, 10),
            warehouse_id: parseInt(warehouse_id, 10),
            invoice_number,
            invoice_date: new Date(invoice_date),
            due_date: new Date(due_date),
            status: status === "" ? undefined : status.toLowerCase(),
            note
        }, { transaction });

        let total = 0;
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

            const gross_amount = parseInt(item.qty, 10) * parseFloat(item.unit_price);
            const taxable_amount = gross_amount - parseFloat(item.discount);
            const total_amount = taxable_amount + parseFloat(item.CGST) + parseFloat(item.SGST);

            total += total_amount;

            await InvoiceItems.create({
                invoice_id: invoice.id,
                product_id: product.id,
                qty: parseInt(item.qty, 10),
                unit_price: parseFloat(item.unit_price),
                gross_amount,
                discount: parseFloat(item.discount),
                taxable_amount,
                CGST: parseFloat(item.CGST),
                SGST: parseFloat(item.SGST),
                total_amount
            }, { transaction });

        };

        const [ isInvoice ] = await Invoice.update(
            { total },
            { where: { id: invoice.id }, transaction }
        );
        if(!isInvoice){
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Invoice creation failed!!!" });
        }

        const [ isStockInward ] = await StockInward.update(
            { invoice_id: invoice.id },
            { where: { id: inward_id }, transaction }
        );
        if(!isStockInward){
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Invoice creation failed!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Invoice created Successfull." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
const deleteInvoice = asyncHandler(async (req, res) => {
    const { StockInward } = req.dbModels;
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "id required!!!" });

        const isDeleted = await StockInward.destroy({ where: { id } });
        if (!isDeleted) return res.status(500).json({ success: false, code: 500, message: "Delete failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateInvoice = asyncHandler(async (req, res) => {
    const { StockInward, Vendor, Invoice } = req.dbModels;
    try {
        const { id = "", vendor_id = "", challan_no = "", invoice = "", t_pass_no = "", vehicle_id = "", driver_id = "", status = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const isStockInwardExists = await StockInward.findByPk(id);
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

        const isUpdate = await StockInward.update(
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

const updateInvoiceItems = asyncHandler(async (req, res) => {
    const { StockInwardItem, Batch, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id = "", barcode = "", unit_cost = "", qty = "", d_qty = "0", s_qty = "0", e_date = "" } = req.body;
        if (!id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });
        }

        const stockInwardItem = await StockInwardItem.findByPk(id);
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

        const [isUpdated] = await StockInwardItem.update(
            updateDetails,
            { where: { id }, transaction }
        );
        if (!isUpdated) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Inward items updation failed!!!" });
        }


        const isUpdate = await Batch.update(
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
            return res.status(404).json({ success: false, code: 404, message: "Inward items updation failed!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Inward items updated successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { getInvoice, createInvoice, deleteInvoice, updateInvoice, updateInvoiceItems };