import { getTenantConnection, rootDB } from "../db/tenantMenager.service.js";

export async function createGrn_items(salesOrder, allocatedItems = []) {
    const { models } = await rootDB();
    const { BpoIndent, ProductMapping } = models;

    let transaction = null;

    try {
        const indent = await BpoIndent.findOne({
            where: { id: salesOrder.central_indent_id }
        });
        if (!indent) throw new Error("Indent not found!!!");


        const { models: tenantModels, sequelize } = await getTenantConnection(indent.buyer_tenant);
        const { GRN, Vendor, PurchasOrder, GRNItem, GRNItemBatch, PurchaseOrderItem } = tenantModels;
        transaction = await sequelize.transaction();

        const po = await PurchasOrder.findOne({
            where: { po_no: salesOrder.source_po_no }
        });
        if (!po) throw new Error("PO not found!!!");

        const vendor = await Vendor.findOne({
            where: {
                tenant: indent.vendor_tenant,
                linked_business_node_id: salesOrder.seller_business_node_id,
                type: "vendor"
            }
        });
        if (!vendor) throw new Error("Vendor not found!!!");

        const grn = await GRN.create({
            grn_no: `GRN-${Date.now()}`,
            purchase_order: po.po_no,
            grn_type: "purchase",
            sender_id: vendor.id,
            receiver_id: po.from_business_node_id,
            mfg_unit_id: po.target_store_id,
            status: "draft"
        }, { transaction });

        if (allocatedItems && allocatedItems.length > 0) {
            // Attempt to iterate over the extracted allocated batches passed from outward allocation
            for (const item of allocatedItems) {
                // Fetch Product mapping to match vendor tenant product id with buyer tenant product id
                const productMap = await ProductMapping.findOne({
                    where: {
                        buyer_node: indent.buyer_tenant,
                        vendor_node: indent.vendor_tenant,
                        vendor_product_id: item.vendor_product_id
                    }
                });

                if (!productMap) {
                    throw new Error(`Product Mapping not found for vendor product ${item.vendor_product_id}`);
                }

                // Query the purchase order item with mapped buyer product id to fetch the ordered item reference
                const poItem = await PurchaseOrderItem.findOne({
                    where: {
                        purchase_order_id: po.id,
                        buyer_product_id: productMap.buyer_product_id
                    }
                });

                // Create the GRN item record connecting PO reference with received quantities
                const grnItem = await GRNItem.create({
                    grn_id: grn.id,
                    purchase_order_item_id: poItem ? poItem.id : null,
                    product_id: productMap.buyer_product_id,
                    ordered_qty: poItem ? poItem.qty : 0,
                    received_qty: item.requested_qty
                }, { transaction });

                // Iterate over allocated batches associated with the current item to create GRN item batches
                for (const batch of item.allocated_batches) {
                    await GRNItemBatch.create({
                        grn_item_id: grnItem.id,
                        batch_no: batch.batch_no,
                        received_qty: batch.allocated_qty,
                        expiry_date: batch.expiry_date || null
                    }, { transaction });
                }
            }
        }

        await transaction.commit();
        return grn;

    } catch (error) {
        if (transaction) await transaction.rollback();
        throw error;
    }
}