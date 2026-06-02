import { getTenantConnection } from "../db/tenantMenager.service.js";

/**
 * Updates the outward record on the seller's tenant DB with damage/shortage
 * information reported during inward acceptance.
 *
 * Only called when damage or shortage is detected (hasDamageOrShortage === true).
 *
 * @param {Object} reference - { tenant: string, outward_no: string } from grn.reference
 * @param {Array}  items     - req.body.items with allocations containing batch_no, d_qty, s_qty
 */
export async function updateOutwardFromInward(reference, items = []) {
    const { tenant, outward_no } = reference;
    if (!tenant || !outward_no) return;

    const { models, sequelize } = await getTenantConnection(tenant);
    const { Outward, OutwardItem, OutwardAllocation, Batch } = models;

    const transaction = await sequelize.transaction();

    try {
        // 1. Find the outward record on the seller tenant
        const outward = await Outward.findOne({
            where: { outward_no },
            transaction
        });
        if (!outward) {
            console.warn(`[updateOutwardFromInward] Outward ${outward_no} not found in tenant ${tenant}`);
            await transaction.rollback();
            return;
        }

        // 2. Fetch all outward items for this outward
        const outwardItems = await OutwardItem.findAll({
            where: { outward_id: outward.id },
            transaction
        });

        // 3. Build a lookup: batch_no → { d_qty, s_qty } from inward items
        const batchDamageMap = {};
        for (const item of items) {
            const { allocations = [] } = item;
            for (const alloc of allocations) {
                const { batch_no, d_qty = 0, s_qty = 0 } = alloc;
                if (batch_no && (Number(d_qty) > 0 || Number(s_qty) > 0)) {
                    // If same batch_no appears multiple times, accumulate
                    if (batchDamageMap[batch_no]) {
                        batchDamageMap[batch_no].d_qty += Number(d_qty);
                        batchDamageMap[batch_no].s_qty += Number(s_qty);
                    } else {
                        batchDamageMap[batch_no] = {
                            d_qty: Number(d_qty),
                            s_qty: Number(s_qty)
                        };
                    }
                }
            }
        }

        // 4. For each outward item, find its allocations and match by batch_no
        for (const outwardItem of outwardItems) {
            const allocations = await OutwardAllocation.findAll({
                where: { outward_item_id: outwardItem.id },
                include: [
                    {
                        model: Batch,
                        as: "batch",
                        attributes: ["id", "batch_no"]
                    }
                ],
                transaction
            });

            let itemTotalDamage = 0;
            let itemTotalShortage = 0;

            for (const allocation of allocations) {
                const batchNo = allocation.batch?.batch_no;
                if (!batchNo || !batchDamageMap[batchNo]) continue;

                const { d_qty, s_qty } = batchDamageMap[batchNo];

                await allocation.update({
                    damage_qty: d_qty,
                    shortage_qty: s_qty
                }, { transaction });

                itemTotalDamage += d_qty;
                itemTotalShortage += s_qty;
            }

            // 5. Update outward item totals if any damage/shortage was found
            if (itemTotalDamage > 0 || itemTotalShortage > 0) {
                await outwardItem.update({
                    total_damage_qty: itemTotalDamage,
                    total_shortage_qty: itemTotalShortage
                }, { transaction });
            }
        }

        outward.status = "return";
        await outward.save({ transaction });

        await transaction.commit();
        console.log(`[updateOutwardFromInward] Successfully updated outward ${outward_no} in tenant ${tenant}`);

    } catch (error) {
        await transaction.rollback();
        console.error(`[updateOutwardFromInward] Error updating outward ${outward_no}:`, error);
        throw error;
    }
}
