import { DataTypes } from 'sequelize';

/** Migration: connectionRefactor_phase2
 *
 * Completes the refactor started in connectionRefactor_phase1: the new FK columns
 * become NOT NULL and the denormalised columns they replace are dropped.
 *
 *   BlanketOrders.buyer_tenant, vendor_tenant             -> dropped
 *   BpoIndents.buyer_tenant, vendor_tenant                -> dropped
 *   BlanketOrderItems.buyer_product_id, vendor_product_id -> dropped
 */

/** Phase 1 backfilled everything it could resolve. Anything still NULL cannot be
 *  made NOT NULL — report exactly what is left instead of a bare postgres error. */
async function assertBackfillComplete(queryInterface, transaction) {
    const [[leftover]] = await queryInterface.sequelize.query(
        `SELECT
            (SELECT COUNT(*) FROM "BlanketOrders"     WHERE "connection_id"      IS NULL) AS blanket_orders,
            (SELECT COUNT(*) FROM "BpoIndents"        WHERE "connection_id"      IS NULL) AS bpo_indents,
            (SELECT COUNT(*) FROM "BlanketOrderItems" WHERE "product_mapping_id" IS NULL) AS blanket_order_items;`,
        { transaction }
    );

    const unresolved =
        Number(leftover.blanket_orders) +
        Number(leftover.bpo_indents) +
        Number(leftover.blanket_order_items);

    if (unresolved > 0) {
        throw new Error(
            `Cannot apply NOT NULL — ${unresolved} row(s) were never backfilled:\n` +
            `  BlanketOrders.connection_id          : ${leftover.blanket_orders}\n` +
            `  BpoIndents.connection_id             : ${leftover.bpo_indents}\n` +
            `  BlanketOrderItems.product_mapping_id : ${leftover.blanket_order_items}\n` +
            `These are orders with no resolvable connection or product mapping. ` +
            `Delete them (BlanketOrders cascade to their items and indents) and re-run.`
        );
    }
}


export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await assertBackfillComplete(queryInterface, transaction);

        /** ------------------------------------------------------------------
         *  1. Lock the new FKs down
         *  ------------------------------------------------------------------ */
        await queryInterface.changeColumn("BlanketOrders", "connection_id", {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Connections", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });

        await queryInterface.changeColumn("BpoIndents", "connection_id", {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Connections", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });

        await queryInterface.changeColumn("BlanketOrderItems", "product_mapping_id", {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "ProductMappings", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });


        /** ------------------------------------------------------------------
         *  2. Drop the replaced columns (their FK constraints to TenantsNames
         *     go with them)
         *  ------------------------------------------------------------------ */
        await queryInterface.removeColumn("BlanketOrders", "buyer_tenant", { transaction });
        await queryInterface.removeColumn("BlanketOrders", "vendor_tenant", { transaction });

        await queryInterface.removeColumn("BpoIndents", "buyer_tenant", { transaction });
        await queryInterface.removeColumn("BpoIndents", "vendor_tenant", { transaction });

        await queryInterface.removeColumn("BlanketOrderItems", "buyer_product_id", { transaction });
        await queryInterface.removeColumn("BlanketOrderItems", "vendor_product_id", { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}


/** Restores the column shape only — the dropped values are not recoverable.
 *  Re-run the phase 1 backfill in reverse manually if that is ever needed. */
export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn("BlanketOrders", "buyer_tenant", {
            type: DataTypes.STRING,
            allowNull: true,
            references: { model: "TenantsNames", key: "tenant" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        }, { transaction });
        await queryInterface.addColumn("BlanketOrders", "vendor_tenant", {
            type: DataTypes.STRING,
            allowNull: true,
            references: { model: "TenantsNames", key: "tenant" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        }, { transaction });

        await queryInterface.addColumn("BpoIndents", "buyer_tenant", {
            type: DataTypes.STRING,
            allowNull: true,
            references: { model: "TenantsNames", key: "tenant" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        }, { transaction });
        await queryInterface.addColumn("BpoIndents", "vendor_tenant", {
            type: DataTypes.STRING,
            allowNull: true,
            references: { model: "TenantsNames", key: "tenant" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        }, { transaction });

        await queryInterface.addColumn("BlanketOrderItems", "buyer_product_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn("BlanketOrderItems", "vendor_product_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, { transaction });

        /** re-derive the dropped values from the FKs that replaced them */
        await queryInterface.sequelize.query(
            `UPDATE "BlanketOrders" bo
                SET "buyer_tenant" = c."buyer_tenant", "vendor_tenant" = c."vendor_tenant"
               FROM "Connections" c
              WHERE bo."connection_id" = c."id";`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `UPDATE "BpoIndents" bi
                SET "buyer_tenant" = c."buyer_tenant", "vendor_tenant" = c."vendor_tenant"
               FROM "Connections" c
              WHERE bi."connection_id" = c."id";`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `UPDATE "BlanketOrderItems" boi
                SET "buyer_product_id" = pm."buyer_product_id", "vendor_product_id" = pm."vendor_product_id"
               FROM "ProductMappings" pm
              WHERE boi."product_mapping_id" = pm."id";`,
            { transaction }
        );

        await queryInterface.changeColumn("BlanketOrders", "connection_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Connections", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });
        await queryInterface.changeColumn("BpoIndents", "connection_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Connections", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });
        await queryInterface.changeColumn("BlanketOrderItems", "product_mapping_id", {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "ProductMappings", key: "id" },
            onDelete: "RESTRICT",
            onUpdate: "CASCADE",
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
