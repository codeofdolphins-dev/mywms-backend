import { asyncHandler } from '../../utils/asyncHandler.js'
import { rootDB } from "../../db/tenantMenager.service.js"
import { Op } from 'sequelize';

export const rfqExpiryWorker = asyncHandler(async () => {

    const { rootSequelize, models } = await rootDB();
    const rootransaction = await rootSequelize.transaction();

    const { RFQ } = models;

    try {
        const expireRfqs = await RFQ.findAll({
            where: {
                status: "open",
                submission_deadline: {
                    [Op.lt]: new Date()
                }
            }
        });

        for (const rfq of expireRfqs) {
            await rfq.update({
                status: "closed"
            }, { transaction: rootransaction })
        }

        await rootransaction.commit();

    } catch (error) {
        await rootransaction.rollback();
        console.log("Error in rfqExpiry worker:", error);
    }
})