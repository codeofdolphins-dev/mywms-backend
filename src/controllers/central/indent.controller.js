import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js";
import { generateNo } from "../../helper/generate.js";
import { createPO_PoItems, createSO_SOItems, createVendor } from "../../services/indent.service.js";
import { updatePOStatus, updateSOStatus } from "../../services/updateStatus.service.js";


// POST
export const createIndent = asyncHandler(async (req, res) => {
    // console.log(req.body);
    // return

    /** root DB */
    const { rootSequelize, models } = await rootDB();
    const { BlanketOrder, BlanketOrderItem, BpoIndent, BpoIndentItem, ProductMapping, Connection } = models;
    const rootTransaction = await rootSequelize.transaction();


    /** buyer DB */
    const { ManufacturingUnit, Requisition, BusinessNode } = req.dbModels;
    const buyerTransaction = await req.dbObject.transaction();
    const dbName = req.headers["x-tenant-id"];

    // return;

    /** supplier DB */
    let VendorTransaction = null;

    try {
        const { bpo_no = "", target_store_id = "", grand_total = "", connection_id = "", items = "" } = req.body;
        if ([bpo_no, target_store_id, items].some(i => i === "")) throw new Error("Required fields are missing!!!");

        const blanketOrder = await BlanketOrder.findOne({
            where: { bpo_no: bpo_no.trim() },
            include: [{ model: Connection, as: "connection" }]
        });
        if (!blanketOrder) throw new Error("Record not found!!!");

        /******************** Verify Store record *********************/
        const store = await ManufacturingUnit.findByPk(Number(target_store_id), {
            include: [
                {
                    model: BusinessNode,
                    as: "parentBusinessNode",
                    attributes: ["name"]
                }
            ]
        });
        if (!store) throw new Error("Store not found!!!");


        /******************** Verify Requisition *********************/
        const requisition_no = blanketOrder.pr_reference_code;
        const requisition = await Requisition.findOne({ where: { requisition_no } });
        if (!requisition) throw new Error("Requisition record not found!!!");


        /******************** Verify Vendor Tenant *********************/
        const vendorDbName = blanketOrder.connection?.vendor_tenant;
        if (!vendorDbName) throw new Error("Vendor tenant not found in blanket order record!!!");

        /** get vendor database connection */
        const { sequelize, models: VendorModels } = await getTenantConnection(vendorDbName);
        VendorTransaction = await sequelize.transaction();



        const indent = await BpoIndent.create({
            bpo_id: blanketOrder.id,
            connection_id: blanketOrder.connection_id,
            created_by: req.user.id,
            grand_total: Number(grand_total),
        }, { transaction: rootTransaction });

        indent.indent_no = generateNo("EX-Indent", indent.id);
        await indent.save({ transaction: rootTransaction });

        /** each side's local product id now lives on the product mapping — resolve it
         *  here so the PO/SO writers never take it from the request */
        const resolvedItems = [];

        /** create indent items and update blanket order items */
        for (const item of items) {
            const { bpo_item_id = "", release_qty = "", unit_price = "" } = item;
            if (!bpo_item_id) throw new Error("bpo_item_id must required!!!");

            const blanketOrderItem = await BlanketOrderItem.findByPk(Number(bpo_item_id), {
                include: [{ model: ProductMapping, as: "productMapping", attributes: ["id", "buyer_product_id", "vendor_product_id"] }]
            });
            if (!blanketOrderItem) throw new Error("Blanket order item not found!!!");
            if (!blanketOrderItem.productMapping) throw new Error("Product mapping not found for blanket order item!!!");

            resolvedItems.push({
                ...item,
                buyer_product_id: blanketOrderItem.productMapping.buyer_product_id,
                vendor_product_id: blanketOrderItem.productMapping.vendor_product_id,
                remaining_qty: blanketOrderItem.remain_contracted_qty,
            });

            /** create indent items */
            await BpoIndentItem.create({
                indent_id: indent.id,
                bpo_item_id: Number(bpo_item_id),
                release_qty,
                unit_price,
                line_total: release_qty * unit_price
            }, { transaction: rootTransaction });

            /** update blanket order items */
            await BlanketOrderItem.update({
                consumed_qty: Sequelize.literal(`consumed_qty + ${release_qty}`),
                remain_contracted_qty: Sequelize.literal(`remain_contracted_qty - ${release_qty}`)
            }, { where: { id: Number(bpo_item_id) }, transaction: rootTransaction });
        };

        /** check if all items of the blanket order are fully consumed */
        const activeItemsCount = await BlanketOrderItem.count({
            where: {
                bpo_id: blanketOrder.id,
                remain_contracted_qty: { [Op.gt]: 0 }
            },
            transaction: rootTransaction
        });

        if (activeItemsCount === 0) {
            await blanketOrder.update({ status: "closed" }, { transaction: rootTransaction });
        }


        /******************** create vendor record on buyer side *********************/
        const vendor = await createVendor(req.dbModels, buyerTransaction, VendorModels, vendorDbName, connection_id);

        /******************** create PO record on buyer side *********************/
        const purchaseOrder = await createPO_PoItems(req.dbModels, buyerTransaction, req, vendor.id, blanketOrder.id, requisition, indent.id, resolvedItems);


        /******************** create buyer record on vendor side *********************/
        const buyer = await createVendor(VendorModels, VendorTransaction, req.dbModels, dbName, connection_id, "buyer");

        /******************** create SO record on vendor/supplier side *********************/
        const salesOrder = await createSO_SOItems(VendorModels, VendorTransaction, req.dbModels, req.body, purchaseOrder, vendor, buyer, store, indent.id, resolvedItems);

        
        await indent.update({
            buyer_po_id: purchaseOrder.id,
            supplier_so_id: salesOrder.id,
        }, { transaction: rootTransaction });



        await rootTransaction.commit();
        await buyerTransaction.commit();
        if (VendorTransaction) await VendorTransaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Indent record created" });

    } catch (error) {
        await rootTransaction.rollback();
        await buyerTransaction.rollback();
        if (VendorTransaction) await VendorTransaction?.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


/** this will update status of PO and SO via indent */
export const updateStatusViaIndent = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { BpoIndent, Connection } = models;
    try {
        const { bpo_id = "", po_id = "", status = "" } = req.body;
        if (!bpo_id || !po_id || !status) throw new Error("Required fields are missing!!!");

        const indent = await BpoIndent.findOne({
            where: {
                bpo_id: Number(bpo_id),
                buyer_po_id: Number(po_id)
            },
            include: [{ model: Connection, as: "connection" }]
        });
        if (!indent) throw new Error("Indent record not found!!!");

        await updatePOStatus(indent, status);
        await updateSOStatus(indent, status);

        return res.status(200).json({ success: true, code: 200, message: "Status updated successfully" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
})