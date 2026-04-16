import { getTenantConnection, rootDB } from "../db/tenantMenager.service.js";

export async function createGrn_items(salesOrder) {
    const { models } = await rootDB();
    const { BpoIndent } = models;

    let transaction = null;

    try {
        const indent = await BpoIndent.findOne({
            where: { id: salesOrder.central_indent_id }
        });
        if (!indent) throw new Error("Indent not found!!!");


        const { models, sequelize } = await getTenantConnection(indent.buyer_tenant);
        const { GRN, Vendor, PurchasOrder } = models;
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

        await transaction.commit();
        return grn;

    } catch (error) {
        if (transaction) await transaction.rollback();
        throw error;
    }
}