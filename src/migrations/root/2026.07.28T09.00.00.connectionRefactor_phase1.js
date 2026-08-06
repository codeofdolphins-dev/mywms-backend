import { DataTypes } from 'sequelize';

/** Migration: connectionRefactor_phase1
 *
 * Phase 1 of replacing the denormalised tenant/product columns with the real FKs:
 *   BlanketOrders.buyer_tenant + vendor_tenant      -> connection_id
 *   BpoIndents.buyer_tenant + vendor_tenant         -> connection_id
 *   BlanketOrderItems.buyer_product_id + vendor_product_id -> product_mapping_id
 *
 * Additive only — the old columns stay and keep working. New columns are nullable
 * so the current write paths (which do not populate them yet) still succeed.
 * They are flipped to NOT NULL and the old columns dropped in a later phase.
 *
 * The new FKs use ON DELETE RESTRICT on purpose: ProductMappings.connection_id is
 * CASCADE, so a CASCADE here would let deleting one Connection wipe every blanket
 * order, indent and their items — contract history.
 */

/** ProductMappings has no unique constraint today and the conflict guard lives in the
 *  application layer, so duplicates are possible. Report them clearly instead of
 *  letting CREATE UNIQUE INDEX fail with a raw postgres error. */
async function assertNoDuplicateMappings(queryInterface, transaction) {
    const [duplicates] = await queryInterface.sequelize.query(
        `SELECT 'buyer_product_id' AS side, "connection_id", "buyer_product_id" AS product_id, COUNT(*) AS total
           FROM "ProductMappings"
          GROUP BY "connection_id", "buyer_product_id"
         HAVING COUNT(*) > 1
          UNION ALL
         SELECT 'vendor_product_id' AS side, "connection_id", "vendor_product_id" AS product_id, COUNT(*) AS total
           FROM "ProductMappings"
          GROUP BY "connection_id", "vendor_product_id"
         HAVING COUNT(*) > 1;`,
        { transaction }
    );

    if (duplicates.length > 0) {
        const details = duplicates
            .map(d => `connection_id=${d.connection_id} ${d.side}=${d.product_id} (${d.total} rows)`)
            .join("\n  ");
        throw new Error(
            `Duplicate ProductMappings found — resolve them before running this migration:\n  ${details}`
        );
    }
}


export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        /** ------------------------------------------------------------------
         *  1. Guard the mapping table before anything starts depending on it
         *  ------------------------------------------------------------------ */
        await assertNoDuplicateMappings(queryInterface, transaction);

        await queryInterface.addIndex("ProductMappings", ["connection_id", "buyer_product_id"], {
            name: "product_mappings_connection_buyer_product_unique",
            unique: true,
            transaction,
        });

        await queryInterface.addIndex("ProductMappings", ["connection_id", "vendor_product_id"], {
            name: "product_mappings_connection_vendor_product_unique",
            unique: true,
            transaction,
        });


        /** ------------------------------------------------------------------
         *  2. New FK columns — nullable for now, RESTRICT on delete
         *  ------------------------------------------------------------------ */
        await queryInterface.addColumn("BlanketOrders", "connection_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Connections", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });

        await queryInterface.addColumn("BpoIndents", "connection_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Connections", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });

        await queryInterface.addColumn("BlanketOrderItems", "product_mapping_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "ProductMappings", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });


        /** ------------------------------------------------------------------
         *  3. Backfill BlanketOrders.connection_id
         *
         *  Exact path first: the quotation revision the BPO was built from already
         *  points at ProductMappings, and those carry the connection that was
         *  verified when the quotation was created.
         *  ------------------------------------------------------------------ */
        await queryInterface.sequelize.query(
            `UPDATE "BlanketOrders" bo
                SET "connection_id" = src."connection_id"
               FROM (
                    SELECT DISTINCT ON (qi."revision_id")
                           qi."revision_id",
                           pm."connection_id"
                      FROM "RfqQuotationItems" qi
                      JOIN "ProductMappings" pm ON pm."id" = qi."product_map_id"
                     ORDER BY qi."revision_id", pm."connection_id"
               ) src
              WHERE bo."rfq_quotation_revision_id" = src."revision_id"
                AND bo."connection_id" IS NULL;`,
            { transaction }
        );

        /** Fallback for rows with no usable revision link: resolve by tenant pair.
         *  A pair can hold several connections (different connection_type), so pick
         *  deterministically — active first, non-pending next, then oldest. */
        await queryInterface.sequelize.query(
            `UPDATE "BlanketOrders" bo
                SET "connection_id" = src."id"
               FROM (
                    SELECT DISTINCT ON (c."buyer_tenant", c."vendor_tenant")
                           c."id", c."buyer_tenant", c."vendor_tenant"
                      FROM "Connections" c
                     ORDER BY c."buyer_tenant",
                              c."vendor_tenant",
                              c."connection_status" DESC,
                              (c."connection_type" = 'pending') ASC,
                              c."id" ASC
               ) src
              WHERE bo."connection_id" IS NULL
                AND bo."buyer_tenant" = src."buyer_tenant"
                AND bo."vendor_tenant" = src."vendor_tenant";`,
            { transaction }
        );


        /** ------------------------------------------------------------------
         *  4. Backfill BpoIndents.connection_id — exact, straight off the parent BPO
         *  ------------------------------------------------------------------ */
        await queryInterface.sequelize.query(
            `UPDATE "BpoIndents" bi
                SET "connection_id" = bo."connection_id"
               FROM "BlanketOrders" bo
              WHERE bi."bpo_id" = bo."id"
                AND bi."connection_id" IS NULL
                AND bo."connection_id" IS NOT NULL;`,
            { transaction }
        );


        /** ------------------------------------------------------------------
         *  5. Backfill BlanketOrderItems.product_mapping_id
         *
         *  Strict match on both product ids first.
         *  ------------------------------------------------------------------ */
        await queryInterface.sequelize.query(
            `UPDATE "BlanketOrderItems" boi
                SET "product_mapping_id" = pm."id"
               FROM "BlanketOrders" bo, "ProductMappings" pm
              WHERE boi."bpo_id" = bo."id"
                AND bo."connection_id" IS NOT NULL
                AND pm."connection_id" = bo."connection_id"
                AND pm."buyer_product_id" = boi."buyer_product_id"
                AND pm."vendor_product_id" = boi."vendor_product_id"
                AND boi."product_mapping_id" IS NULL;`,
            { transaction }
        );

        /** Fallback on vendor_product_id alone. createBlanketOrder copied that value
         *  straight out of the mapping, while buyer_product_id came from the request
         *  body and was never cross-checked — so the vendor side is the reliable one.
         *  Safe because of the unique index added in step 1. */
        await queryInterface.sequelize.query(
            `UPDATE "BlanketOrderItems" boi
                SET "product_mapping_id" = pm."id"
               FROM "BlanketOrders" bo, "ProductMappings" pm
              WHERE boi."bpo_id" = bo."id"
                AND bo."connection_id" IS NOT NULL
                AND pm."connection_id" = bo."connection_id"
                AND pm."vendor_product_id" = boi."vendor_product_id"
                AND boi."product_mapping_id" IS NULL;`,
            { transaction }
        );


        /** ------------------------------------------------------------------
         *  6. Index the new columns — postgres does not index FKs automatically
         *     and these become join predicates once the read paths switch over
         *  ------------------------------------------------------------------ */
        await queryInterface.addIndex("BlanketOrders", ["connection_id"], {
            name: "blanket_orders_connection_id_idx",
            transaction,
        });
        await queryInterface.addIndex("BpoIndents", ["connection_id"], {
            name: "bpo_indents_connection_id_idx",
            transaction,
        });
        await queryInterface.addIndex("BlanketOrderItems", ["product_mapping_id"], {
            name: "blanket_order_items_product_mapping_id_idx",
            transaction,
        });


        /** ------------------------------------------------------------------
         *  7. Report anything the backfill could not resolve. These stay NULL and
         *     must be fixed before the NOT NULL phase.
         *  ------------------------------------------------------------------ */
        const [[leftover]] = await queryInterface.sequelize.query(
            `SELECT
                (SELECT COUNT(*) FROM "BlanketOrders"     WHERE "connection_id"      IS NULL) AS blanket_orders,
                (SELECT COUNT(*) FROM "BpoIndents"        WHERE "connection_id"      IS NULL) AS bpo_indents,
                (SELECT COUNT(*) FROM "BlanketOrderItems" WHERE "product_mapping_id" IS NULL) AS blanket_order_items;`,
            { transaction }
        );

        const unresolved = Number(leftover.blanket_orders) + Number(leftover.bpo_indents) + Number(leftover.blanket_order_items);
        if (unresolved > 0) {
            console.warn(
                `⚠️  Backfill left rows unresolved — these must be fixed before the NOT NULL phase:\n` +
                `      BlanketOrders.connection_id      : ${leftover.blanket_orders}\n` +
                `      BpoIndents.connection_id         : ${leftover.bpo_indents}\n` +
                `      BlanketOrderItems.product_mapping_id : ${leftover.blanket_order_items}`
            );
        } else {
            console.log("✅ Backfill resolved every existing row.");
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}


export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.removeIndex("BlanketOrderItems", "blanket_order_items_product_mapping_id_idx", { transaction });
        await queryInterface.removeIndex("BpoIndents", "bpo_indents_connection_id_idx", { transaction });
        await queryInterface.removeIndex("BlanketOrders", "blanket_orders_connection_id_idx", { transaction });

        await queryInterface.removeColumn("BlanketOrderItems", "product_mapping_id", { transaction });
        await queryInterface.removeColumn("BpoIndents", "connection_id", { transaction });
        await queryInterface.removeColumn("BlanketOrders", "connection_id", { transaction });

        await queryInterface.removeIndex("ProductMappings", "product_mappings_connection_vendor_product_unique", { transaction });
        await queryInterface.removeIndex("ProductMappings", "product_mappings_connection_buyer_product_unique", { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
