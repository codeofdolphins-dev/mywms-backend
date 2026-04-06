import { Op } from "sequelize";
import { rootDB } from "../db/tenantMenager.service.js";
import { generateBatch, generateNo } from "../helper/generate.js";
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
    const { PurchasOrder, Product, Batch, GRN, GRNItem, PurchaseOrderItem, NodeStockLedger, NodeStockLedgerItem } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { po_no = "", batch = "", received_date = "", items = [] } = req.body;
        const userDetails = req.user;

        if (!po_no) throw new Error("po_no required!!!");
        if (items.length == 0) throw new Error("items should not empty!!!");

        if (batch) {
            const isBatchExists = await Batch.findOne({ where: { batch_no: batch } });
            if (isBatchExists) throw new Error("Batch no already exists!!!");
        }

        const po = await PurchasOrder.findOne({
            where: {
                po_no: {
                    [Op.iLike]: po_no?.trim()
                }
            }
        });
        if (!po) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Purchase Order record not found!!!" });
        };

        const grn = await GRN.create({
            purchase_order_id: po.id,
            from_node_id: po.from_business_node_id,
            to_node_id: po.to_supplier_id,
            received_date: received_date ? new Date(received_date) : new Date(),
            created_by: userDetails.id

        }, { transaction });
        const grn_no = generateNo("GRN", grn.id)
        await grn.update({ grn_no }, { transaction });

        // Create Ledger Header once per Inward
        const nodeStockLedger = await NodeStockLedger.create({
            transaction_type: "grn_receipt",
            ledger_context: "mfg_inward",
            txn_date: received_date ? new Date(received_date) : new Date(),
            from_location_id: po.to_supplier_id || po.from_business_node_id,
            from_location_type: "business_node",
            to_location_id: po.from_business_node_id,
            to_location_type: "business_node",
            reference_id: grn.id,
            reference_type: "grn",
            created_by: userDetails.id
        }, { transaction });
        const ledger_no = generateNo("LEDG", nodeStockLedger.id);
        await nodeStockLedger.update({ ledger_no }, { transaction });

        for (const item of items) {

            const { po_item_id, product_id, d_qty, e_date, m_date, r_qty, s_qty } = item;
            const product = await Product.findByPk(Number(product_id));
            if (!product) throw new Error(`Product id: ${product_id} not found`);

            const purchaseOrderItem = await PurchaseOrderItem.findByPk(Number(po_item_id));
            if (!purchaseOrderItem) throw new Error(`Item record not found!!!`);

            /** create GRN item record */
            await GRNItem.create({
                grn_id: grn.id,
                purchase_order_item_id: purchaseOrderItem.id,
                product_id: product.id,
                ordered_qty: Number(purchaseOrderItem.qty),
                shortage_qty: Number(s_qty || 0),
                damage_qty: Number(d_qty || 0),
                received_qty: Number(r_qty || 0),
                ...(m_date && { mfg_date: new Date(m_date) }),
                ...(e_date && { expiry_date: new Date(e_date) }),
            }, { transaction });

            /** create batch record */
            const newBatch = await Batch.create({
                product_id: product.id,
                location_id: po.from_business_node_id,
                location_type: "business_node",
                ...(batch && { batch_no: batch }),
                available_qty: Number(r_qty || 0),
                reserved_qty: 0,
                unit_price: purchaseOrderItem.unit_price || 0,
                batch_status: "active",
                received_date: received_date ? new Date(received_date) : new Date(),
                reference_id: grn.id,
                reference_type: "grn",
                ...(m_date && { mfg_date: new Date(m_date) }),
                ...(e_date && { expiry_date: new Date(e_date) }),
            }, { transaction });

            if (!batch) {
                const batchNo = generateBatch(newBatch.id);
                await newBatch.update({ batch_no: batchNo }, { transaction });
            }

            /** create nodeStockLedgerItem record */
            await NodeStockLedgerItem.create({
                ledger_id: nodeStockLedger.id,
                product_id: product.id,
                batch_id: newBatch.id,
                qty: Number(r_qty || 0),
                unit_type: product.unit_type || "pcs",
                unit_price: purchaseOrderItem.unit_price,
                total_value: Number(r_qty || 0) * Number(purchaseOrderItem.unit_price || 0)
            }, { transaction });
        };

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record Created Successfull" });

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
        if (!isInventoryUpdated) {
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