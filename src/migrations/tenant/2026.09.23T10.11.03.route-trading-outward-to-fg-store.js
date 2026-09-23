/** Migration: route-trading-outward-to-fg-store — trading outwards raised against a manufacturing node were
 * created without a store, so none of the node's store users could see them. Route every such outward that is
 * still open to the node's FG store, when the node has exactly one (otherwise it needs a manual choice). */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.sequelize.query(`
            UPDATE "Outwards" o
            SET store_id = fg.id
            FROM (
                SELECT business_node_id, MIN(id) AS id
                FROM "ManufacturingUnits"
                WHERE store_type = 'fg_store'
                GROUP BY business_node_id
                HAVING COUNT(*) = 1
            ) fg
            WHERE fg.business_node_id = o.seller_business_node_id
              AND o.store_id IS NULL
              AND o.status = 'pending'
              AND o.meta->>'trading' = 'true'
        `, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down() {
    // data fix — the outwards were never meant to be store-less
}
