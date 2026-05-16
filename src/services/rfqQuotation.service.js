import { getTenantConnection } from "../db/tenantMenager.service.js";

export const updateRequisitionStatus = async (rfq_record) => {
    let transaction = null;
    try {
        const { buyer_tenant, pr_reference_code } = rfq_record;
        if (!buyer_tenant) throw new Error("Buyer tenant is required!!!");

        const { models: { Requisition }, sequelize } = await getTenantConnection(buyer_tenant);
        transaction = await sequelize.transaction();

        const req = await Requisition.findOne({ where: { requisition_no: pr_reference_code }, transaction });
        if (!req) throw new Error("Requisition not found!!!");

        if (req.status === "pending") {
            req.status = "quoted";
            await req.save({ transaction });
        }

        return transaction;
    } catch (error) {
        if (transaction) await transaction.rollback();
        throw error;
    }
}