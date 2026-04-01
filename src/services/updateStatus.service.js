import { getTenantConnection } from "../db/tenantMenager.service.js";

/** update PO status */
export const updatePOStatus = async (indentData, status) => {
    const { sequelize, models } = await getTenantConnection(indentData.buyer_tenant);
    const { PurchasOrder } = models;
    const transaction = await sequelize.transaction();

    try {
        const po = await PurchasOrder.findByPk(indentData.buyer_po_id);
        if (!po) throw new Error("PO not found");
        po.status = status;
        await po.save({ transaction });

        return await transaction.commit();

    } catch (err) {
        console.error(err);
        await transaction.rollback()
        throw err;
    }
};

/** update So status */
export const updateSOStatus = async (indentData, status) => {
    const { sequelize, models } = await getTenantConnection(indentData.vendor_tenant);
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