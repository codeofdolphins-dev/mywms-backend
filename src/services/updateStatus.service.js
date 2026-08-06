import { getTenantConnection } from "../db/tenantMenager.service.js";

/** update PO status */
/** indentData must be loaded with its `connection` — both tenants live there */
export const updatePOStatus = async (indentData, status, updateStatus = true) => {
    const buyerTenant = indentData.connection?.buyer_tenant;
    if (!buyerTenant) throw new Error("Indent connection not loaded — buyer tenant unavailable!!!");

    const { sequelize, models } = await getTenantConnection(buyerTenant);
    const { PurchasOrder } = models;
    const transaction = await sequelize.transaction();

    try {
        const po = await PurchasOrder.findByPk(indentData.buyer_po_id);
        if (!po) throw new Error("PO not found");

        // no need to update status if status is already closed
        if (!updateStatus) return po;

        po.status = status;
        await po.save({ transaction });

        await transaction.commit();
        return po;

    } catch (err) {
        console.error(err);
        await transaction.rollback()
        throw err;
    }
};

/** update So status */
export const updateSOStatus = async (indentData, status, updateStatus = true) => {

    // no need to update status if status is already closed
    if (!updateStatus) return;

    const vendorTenant = indentData.connection?.vendor_tenant;
    if (!vendorTenant) throw new Error("Indent connection not loaded — vendor tenant unavailable!!!");

    const { sequelize, models } = await getTenantConnection(vendorTenant);
    const { SalesOrder } = models;
    const transaction = await sequelize.transaction();

    try {
        const so = await SalesOrder.findByPk(indentData.supplier_so_id);
        if (!so) throw new Error("SO not found");
        so.status = status;
        await so.save({ transaction });

        return await transaction.commit();

    } catch (err) {
        console.error(err);
        await transaction.rollback()
        throw err;
    }
};