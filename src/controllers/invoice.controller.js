import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
const getInvoice = asyncHandler(async (req, res) => {
    const { Invoice, InvoiceItems, PurchasOrder, Vendor, User, Warehouse } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", invoice_no = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const invoice = await Invoice.findAndCountAll({
            where: (id || invoice_no) ? { [Op.or]: [{ id: parseInt(id, 10) || null }, { invoice_number: invoice_no }] } : undefined,
            include: [
                { model: PurchasOrder, as: "invoicePurchasOrder" },
                { model: Warehouse, as: "invoiceWarehouse" },
                { model: InvoiceItems, as: "invoiceItems" },
                // { model: User, as: "inwardBy" },
                // { model: InwardItem, as: "items" }
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
    const { Invoice, InvoiceItems, PurchasOrder, Product, Inward, Warehouse } = req.dbModels;
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
        const isInwardExists = await Inward.findByPk(inward_id);
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

        const [isInvoice] = await Invoice.update(
            { total },
            { where: { id: invoice.id }, transaction }
        );
        if (!isInvoice) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Invoice creation failed!!!" });
        }

        const [isStockInward] = await Inward.update(
            { invoice_id: invoice.id },
            { where: { id: inward_id }, transaction }
        );
        if (!isStockInward) {
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
    const { Invoice } = req.dbModels;
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "id required!!!" });

        const isDeleted = await Invoice.destroy({ where: { id } });
        if (!isDeleted) return res.status(500).json({ success: false, code: 500, message: "Delete failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Delete Successfull." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT
const updateInvoice = asyncHandler(async (req, res) => {
    const { Invoice, Warehouse } = req.dbModels;
    try {
        const { id = "", warehouse_id = "", invoice_number = "", invoice_date = "", due_date = "", status = "", note = "" } = req.body;
        if (!id) return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });

        const isInvoiceExists = await Invoice.findByPk(id);
        if (!isInvoiceExists) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        let updateDetails = {};
        if (invoice_number) updateDetails.invoice_number = invoice_number;
        if (invoice_date) updateDetails.invoice_date = new Date(invoice_date);
        if (due_date) updateDetails.due_date = new Date(due_date);
        if (status) updateDetails.status = status !== "" ? status.toLowerCase() : undefined;
        if (note) updateDetails.note = note;
        if (warehouse_id) {
            const isExists = await Warehouse.findByPk(parseInt(warehouse_id, 10));
            if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Warehouse not found!!!" });
            updateDetails.warehouse_id = parseInt(warehouse_id, 10);
        }

        const isUpdate = await Invoice.update(
            updateDetails,
            { where: { id } }
        );
        if (!isUpdate) return res.status(404).json({ success: false, code: 404, message: "Invoice updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Invoice updated successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateInvoiceItems = asyncHandler(async (req, res) => {
    const { Invoice, InvoiceItems, Product } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { id = "", barcode = "", qty = "", unit_price = "", discount = "", CGST = "", SGST = "" } = req.body;
        if (!id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });
        }

        const invoiceItems = await InvoiceItems.findByPk(id, { transaction });
        if (!invoiceItems) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });
        }

        const invoice = await Invoice.findByPk(invoiceItems.invoice_id, { transaction });

        // Start with existing values
        let newQty = parseInt(qty, 10) || parseInt(invoiceItems.qty);
        let newUnit_price = parseFloat(unit_price) || parseFloat(invoiceItems.unit_price) || 0.00;
        let newDiscount = parseFloat(discount) || parseFloat(invoiceItems.discount) || 0.00;
        let newCGST = parseFloat(CGST) || parseFloat(invoiceItems.CGST) || 0.00;
        let newSGST = parseFloat(SGST) || parseFloat(invoiceItems.SGST) || 0.00;

        const gross_amount = newQty * newUnit_price;
        const taxable_amount = gross_amount - newDiscount;
        const total_amount = taxable_amount + newCGST + newSGST;
        const old_total_amount = invoiceItems.total_amount;

        // Build updateDetails object
        let updateDetails = {
            qty: newQty,
            unit_price: newUnit_price,
            gross_amount,
            discount: newDiscount,
            taxable_amount,
            CGST: newCGST,
            SGST: newSGST,
            total_amount: total_amount
        };
        if (barcode) {
            const isExists = await Product.findOne({ where: { barcode }, transaction });
            if (!isExists) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Product not found!!!" });
            }
            updateDetails.product_id = isExists.id;
        }

        const [isItemsUpdated] = await InvoiceItems.update(
            updateDetails,
            { where: { id }, transaction }
        );
        if (!isItemsUpdated) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Invoice items updation failed!!!" });
        };

        const [isUpdated] = await Invoice.update(
            {
                total: invoice.total - old_total_amount + total_amount
            },
            { where: { id: invoiceItems.invoice_id }, transaction }
        )
        if (!isUpdated) {
            await transaction.rollback();
            return res.status(500).json({ success: false, code: 500, message: "Invoice updation failed!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Invoice items updated successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { getInvoice, createInvoice, deleteInvoice, updateInvoice, updateInvoiceItems };