/** Migration: draft-grn-to-transit — the inward screen only lists transit / report / accepted GRNs,
 * but PO (external) and internal outwards still created GRNs as "draft", so they never showed up.
 * Move pending drafts into transit and give old PO GRNs the seller tenant the list needs. */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.sequelize.query(
            `UPDATE "GRNs" SET status = 'transit' WHERE status = 'draft'`,
            { transaction }
        );

        /** old PO GRNs stored reference.tenant = buyer's own tenant; the seller tenant lives on the Vendor */
        await queryInterface.sequelize.query(`
            UPDATE "GRNs" g
            SET reference = (g.reference - 'tenant')
                || jsonb_build_object('buyer_tenant', g.reference->>'tenant', 'vendor_tenant', v.tenant)
            FROM "Vendors" v
            WHERE v.id = g.sender_id
              AND g.grn_type = 'purchase'
              AND g.reference ? 'outward_no'
              AND g.reference ? 'tenant'
              AND NOT g.reference ? 'vendor_tenant'
        `, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        /** only GRNs nobody has reported yet can go back to draft */
        await queryInterface.sequelize.query(
            `UPDATE "GRNs" SET status = 'draft' WHERE status = 'transit' AND (reference->>'trading') IS NULL`,
            { transaction }
        );

        await queryInterface.sequelize.query(`
            UPDATE "GRNs"
            SET reference = (reference - 'buyer_tenant' - 'vendor_tenant') || jsonb_build_object('tenant', reference->>'buyer_tenant')
            WHERE grn_type = 'purchase' AND reference ? 'outward_no' AND reference ? 'buyer_tenant' AND (reference->>'trading') IS NULL
        `, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
