import { Op } from "sequelize";
import { getTenantConnection, rootDB } from "../db/tenantMenager.service.js";
import { generateBatch, generateNo } from "../helper/generate.js";
import { asyncHandler } from "../utils/asyncHandler.js";


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









export const grnList = asyncHandler(async (req, res) => {
    const { GRN, User, GRNItem } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", grn_no = "", status = "", sortBy = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const { count, rows } = await GRN.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(grn_no && { grn_no }),
                ...(status && { status }),
                ...(sortBy && {
                    [Op.or]: [
                        { status: sortBy.toLowerCase() },
                        { grn_type: sortBy.toLowerCase() },
                    ],
                }),
            },
            include: [
                {
                    model: GRNItem,
                    as: "grnLineItems",
                    required: false,
                },
                {
                    model: User,
                    as: "creator",
                    required: false,
                    attributes: ["name", "email", "profile_image"]
                },
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            distinct: true, // Needed when using includes with hasMany
        });

        const totalPages = Math.ceil(count / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: rows,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page,
                limit,
            },
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const grnItemDetailsViaPO = asyncHandler(async (req, res) => {

    /****************** buyer db models ******************/
    const { PurchasOrder, Product } = req.dbModels;

    /****************** central db models ******************/
    const { models } = await rootDB();
    const { BpoIndent, BpoIndentItem, BlanketOrderItem, ProductMapping } = models;


    try {
        const { po_no } = req.params;

        const po = await PurchasOrder.findOne({
            where: { po_no },
        });

        /** Get indent record from CENTRAL */
        const bpoIndent = await BpoIndent.findOne({
            where: { buyer_po_id: po.id },
        });


        /****************** supplier db models ******************/
        const { models: supplierModels } = await getTenantConnection(bpoIndent.vendor_tenant);
        const { Outward, OutwardItem, OutwardAllocation, Batch } = supplierModels;

        const outward = await Outward.findOne({
            where: {
                sales_order_id: bpoIndent.supplier_so_id,
                status: "dispatched",
            },
            order: [["createdAt", "DESC"]],
            limit: 1,
            include: [
                {
                    model: OutwardItem,
                    as: "outwardItemList",
                    attributes: ["id", "vendor_product_id", "requested_qty", "unit_price"],
                    include: [
                        {
                            model: OutwardAllocation,
                            as: "outwardItemAllocations",
                            attributes: ["batch_id"],
                            include: [
                                {
                                    model: Batch,
                                    as: "batch",
                                    attributes: ["batch_no", "expiry_date"]
                                }
                            ]
                        }
                    ]
                }
            ]
        });


        const bpoIndentItems = await BpoIndentItem.findAll({
            where: { indent_id: bpoIndent.id },
        });

        const bpoItemIds = bpoIndentItems.map(item => item.bpo_item_id);
        const blanketOrderItems = await BlanketOrderItem.findAll({
            where: { id: bpoItemIds }
        });

        const productMappingMap = {};
        for (const boItem of blanketOrderItems) {
            productMappingMap[boItem.vendor_product_id] = boItem.buyer_product_id;
        }

        // Fallback to ProductMapping just in case
        const vendorProductIds = outward ? outward.outwardItemList.map(item => item.vendor_product_id) : [];
        if (vendorProductIds.length > 0) {
            const mappings = await ProductMapping.findAll({
                where: {
                    vendor_product_id: vendorProductIds,
                    buyer_node: bpoIndent.buyer_tenant,
                    vendor_node: bpoIndent.vendor_tenant
                }
            });
            for (const map of mappings) {
                // Only override if not already set, or just override
                if (!productMappingMap[map.vendor_product_id]) {
                    productMappingMap[map.vendor_product_id] = map.buyer_product_id;
                }
            }
        }

        let finalData = [];
        if (outward && outward.outwardItemList) {
            finalData = outward.outwardItemList.map(item => {
                const itemData = item.toJSON();
                itemData.buyer_product_id = productMappingMap[itemData.vendor_product_id] || null;
                return itemData;
            });
        }

        // Gather all the buyer product IDs we mapped
        const buyerProductIds = [...new Set(finalData.map(item => item.buyer_product_id).filter(Boolean))];

        // Fetch product details for these IDs
        let buyerProducts = [];
        if (buyerProductIds.length > 0) {
            // Need to use Op if it wasn't imported locally, but let's just use regular standard query
            buyerProducts = await Product.findAll({
                where: { id: buyerProductIds }
            });
        }

        // Make a map of id -> product object
        const buyerProductMap = {};
        for (const prod of buyerProducts) {
            buyerProductMap[prod.id] = prod.toJSON();
        }

        finalData.forEach(item => {
            if (item.outwardItemAllocations) {
                item.outwardItemAllocations = item.outwardItemAllocations
                    .filter(allocation => allocation.batch)
                    .map(allocation => allocation.batch);
            }
            if (item.buyer_product_id && buyerProductMap[item.buyer_product_id]) {
                item.buyer_product_details = buyerProductMap[item.buyer_product_id];
            } else {
                item.buyer_product_details = null;
            }
        });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: finalData,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const getTenantOutwardData = asyncHandler(async (req, res) => {

    /****************** buyer db models ******************/
    const { PurchasOrder, Product } = req.dbModels;

    /****************** central db models ******************/
    const { models } = await rootDB();
    const { BpoIndent, BpoIndentItem, BlanketOrderItem, ProductMapping } = models;


    try {
        const { po_no } = req.params;

        const po = await PurchasOrder.findOne({
            where: { po_no },
        });

        /** Get indent record from CENTRAL */
        const bpoIndent = await BpoIndent.findOne({
            where: { buyer_po_id: po.id },
        });


        /****************** supplier db models ******************/
        const { models: supplierModels } = await getTenantConnection(bpoIndent.vendor_tenant);
        const { Outward, OutwardItem, OutwardAllocation, Batch } = supplierModels;

        const outward = await Outward.findOne({
            where: {
                sales_order_id: bpoIndent.supplier_so_id,
                status: "dispatched",
            },
            order: [["createdAt", "DESC"]],
            limit: 1,
            include: [
                {
                    model: OutwardItem,
                    as: "outwardItemList",
                    attributes: ["id", "vendor_product_id", "requested_qty", "unit_price"],
                    include: [
                        {
                            model: OutwardAllocation,
                            as: "outwardItemAllocations",
                            attributes: ["batch_id"],
                            include: [
                                {
                                    model: Batch,
                                    as: "batch",
                                    attributes: ["batch_no", "expiry_date"]
                                }
                            ]
                        }
                    ]
                }
            ]
        });


        const bpoIndentItems = await BpoIndentItem.findAll({
            where: { indent_id: bpoIndent.id },
        });

        const bpoItemIds = bpoIndentItems.map(item => item.bpo_item_id);
        const blanketOrderItems = await BlanketOrderItem.findAll({
            where: { id: bpoItemIds }
        });

        const productMappingMap = {};
        for (const boItem of blanketOrderItems) {
            productMappingMap[boItem.vendor_product_id] = boItem.buyer_product_id;
        }

        // Fallback to ProductMapping just in case
        const vendorProductIds = outward ? outward.outwardItemList.map(item => item.vendor_product_id) : [];
        if (vendorProductIds.length > 0) {
            const mappings = await ProductMapping.findAll({
                where: {
                    vendor_product_id: vendorProductIds,
                    buyer_node: bpoIndent.buyer_tenant,
                    vendor_node: bpoIndent.vendor_tenant
                }
            });
            for (const map of mappings) {
                // Only override if not already set, or just override
                if (!productMappingMap[map.vendor_product_id]) {
                    productMappingMap[map.vendor_product_id] = map.buyer_product_id;
                }
            }
        }

        let finalData = [];
        if (outward && outward.outwardItemList) {
            finalData = outward.outwardItemList.map(item => {
                const itemData = item.toJSON();
                itemData.buyer_product_id = productMappingMap[itemData.vendor_product_id] || null;
                return itemData;
            });
        }

        // Gather all the buyer product IDs we mapped
        const buyerProductIds = [...new Set(finalData.map(item => item.buyer_product_id).filter(Boolean))];

        // Fetch product details for these IDs
        let buyerProducts = [];
        if (buyerProductIds.length > 0) {
            // Need to use Op if it wasn't imported locally, but let's just use regular standard query
            buyerProducts = await Product.findAll({
                where: { id: buyerProductIds }
            });
        }

        // Make a map of id -> product object
        const buyerProductMap = {};
        for (const prod of buyerProducts) {
            buyerProductMap[prod.id] = prod.toJSON();
        }

        finalData.forEach(item => {
            if (item.outwardItemAllocations) {
                item.outwardItemAllocations = item.outwardItemAllocations
                    .filter(allocation => allocation.batch)
                    .map(allocation => allocation.batch);
            }
            if (item.buyer_product_id && buyerProductMap[item.buyer_product_id]) {
                item.buyer_product_details = buyerProductMap[item.buyer_product_id];
            } else {
                item.buyer_product_details = null;
            }
        });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: finalData,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
export const createInward = asyncHandler(async (req, res) => {
    const { PurchasOrder, Product, Batch, GRN, GRNItem, GRNItemBatch, PurchaseOrderItem, NodeStockLedger, NodeStockLedgerItem } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { po_no = "", grn_no = "", items = [] } = req.body;
        const userDetails = req.user;

        if (!grn_no) throw new Error("grn_no required!!!");
        if (items.length === 0) throw new Error("items should not be empty!!!");

        // Find GRN record
        const grn = await GRN.findOne({ where: { grn_no } });
        if (!grn) throw new Error("GRN record not found!!");

        // Optionally find PO (po_no is not mandatory)
        let po = null;
        if (po_no) {
            po = await PurchasOrder.findOne({ where: { po_no } });
        }

        // Create Ledger Header once per Inward
        const nodeStockLedger = await NodeStockLedger.create({
            transaction_type: "external_transfer",
            txn_date: new Date(),

            from_location_id: po ? po.from_business_node_id : grn.sender_id,
            from_location_type: po ? "mfg_unit" : "business_node",

            to_location_id: po ? po.from_business_node_id : grn.receiver_id,
            to_location_type: "business_node",

            reference_id: grn.id,
            reference_type: "grn",
            created_by: userDetails.id
        }, { transaction });
        const ledger_no = generateNo("LEDG", nodeStockLedger.id);
        await nodeStockLedger.update({ ledger_no }, { transaction });

        for (const item of items) {
            const { po_item_id, buyer_product_id, vendor_product_id, allocations = [] } = item;

            // Find product by buyer_product_id
            const product = await Product.findByPk(Number(buyer_product_id));
            if (!product) throw new Error(`Product id: ${buyer_product_id} not found`);

            // Optionally find PO item (po_item_id is not mandatory)
            let purchaseOrderItem = null;
            if (po_item_id) {
                purchaseOrderItem = await PurchaseOrderItem.findByPk(Number(po_item_id));
            }

            // Calculate totals from allocations
            const totalReceivedQty = allocations.reduce((sum, a) => sum + Number(a.r_qty || 0), 0);
            const totalDamageQty = allocations.reduce((sum, a) => sum + Number(a.d_qty || 0), 0);
            const totalShortageQty = allocations.reduce((sum, a) => sum + Number(a.s_qty || 0), 0);

            /** create GRN item record */
            const grnItem = await GRNItem.create({
                grn_id: grn.id,
                ...(purchaseOrderItem && { purchase_order_item_id: purchaseOrderItem.id }),
                product_id: product.id,
                ordered_qty: purchaseOrderItem ? Number(purchaseOrderItem.qty) : totalReceivedQty,
                shortage_qty: totalShortageQty,
                damage_qty: totalDamageQty,
                received_qty: totalReceivedQty,
            }, { transaction });

            /** process each allocation (batch-level) */
            for (const allocation of allocations) {
                const { batch_no, d_qty, s_qty, r_qty, e_date } = allocation;

                /** create GRNItemBatch record */
                await GRNItemBatch.create({
                    grn_item_id: grnItem.id,
                    batch_no: batch_no || null,
                    received_qty: Number(r_qty || 0),
                    damage_qty: Number(d_qty || 0),
                    expiry_date: new Date(e_date),
                }, { transaction });

                /** find existing or create new Batch record */
                let newBatch;
                if (batch_no) {
                    newBatch = await Batch.findOne({
                        where: {
                            batch_no,
                            product_id: product.id,
                            location_id: po ? po.from_business_node_id : grn.receiver_id,
                            ...(po?.target_store_id && { store_id: po.target_store_id }),
                        },
                        transaction
                    });
                }

                if (newBatch) {
                    // Batch already exists — increment available_qty
                    await newBatch.update({
                        available_qty: Number(newBatch.available_qty) + Number(r_qty || 0),
                    }, { transaction });
                } else {
                    // Create a new Batch
                    newBatch = await Batch.create({
                        product_id: product.id,
                        location_id: po ? po.from_business_node_id : grn.receiver_id,
                        ...(po?.target_store_id && { store_id: po.target_store_id }),
                        location_type: po?.target_store_id ? "mfg_unit" : "business_node",
                        ...(batch_no && { batch_no }),
                        available_qty: Number(r_qty || 0),
                        reserved_qty: 0,
                        unit_price: purchaseOrderItem ? (purchaseOrderItem.unit_price || 0) : 0,
                        batch_status: "active",
                        received_date: grn.received_date || new Date(),
                        reference_id: grn.id,
                        reference_type: "grn",
                        expiry_date: new Date(e_date),
                    }, { transaction });

                    // Auto-generate batch_no if not provided
                    if (!batch_no) {
                        const generatedBatchNo = generateBatch(newBatch.id);
                        await newBatch.update({ batch_no: generatedBatchNo }, { transaction });
                    }
                }

                /** create NodeStockLedgerItem record */
                const unitPrice = purchaseOrderItem ? Number(purchaseOrderItem.unit_price || 0) : 0;
                await NodeStockLedgerItem.create({
                    ledger_id: nodeStockLedger.id,
                    product_id: product.id,
                    batch_id: newBatch.id,
                    qty: Number(r_qty || 0),
                    unit_type: product.unit_type || "pcs",
                    unit_price: unitPrice,
                    total_value: Number(r_qty || 0) * unitPrice
                }, { transaction });
            }
        }

        grn.status = "accepted";
        grn.received_date = new Date();
        grn.created_by = userDetails.id;
        await grn.save({ transaction });

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Record Created Successfully" });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});