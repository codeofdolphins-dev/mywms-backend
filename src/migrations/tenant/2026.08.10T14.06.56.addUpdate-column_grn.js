import { DataTypes } from 'sequelize';

/** Migration: addReturnStatusAndShortage_grn */

/** enum type name differs per environment (sync vs migration created) — resolve it from the column itself */
async function getStatusEnumName(queryInterface, tableName) {
    const [[col]] = await queryInterface.sequelize.query(
        `SELECT udt_name FROM information_schema.columns
         WHERE table_name = '${tableName}' AND column_name = 'status';`
    );
    if (!col?.udt_name) throw new Error(`${tableName}.status enum type not found!!!`);
    return col.udt_name;
}

export async function up({ context: queryInterface }) {
    /**
     * An inward reporting damage/shortage sets the GRN and the seller's outward to "return",
     * but neither enum was ever given the value — the models declare it, the DB rejects it.
     */
    const grnEnum = await getStatusEnumName(queryInterface, 'GRNs');

    // enum ADD VALUE can not run inside a transaction block
    await queryInterface.sequelize.query(`ALTER TYPE "${grnEnum}" ADD VALUE IF NOT EXISTS 'transit';`);
    await queryInterface.sequelize.query(`ALTER TYPE "${grnEnum}" ADD VALUE IF NOT EXISTS 'report';`);
}

export async function down({ context: queryInterface }) {
    const grnEnum = await getStatusEnumName(queryInterface, 'GRNs');
    const transaction = await queryInterface.sequelize.transaction();

    // Postgres can not drop a single enum value — rebuild the enum without the added values.
    try {
        await queryInterface.sequelize.query(
            `UPDATE "GRNs" SET "status" = 'accepted' WHERE "status" IN ('transit', 'report');`,
            { transaction }
        );

        await queryInterface.sequelize.query(
            `ALTER TYPE "${grnEnum}" RENAME TO "${grnEnum}_old";`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `CREATE TYPE "${grnEnum}" AS ENUM ('draft', 'accepted', 'cancelled', 'return');`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `ALTER TABLE "GRNs"
                ALTER COLUMN "status" DROP DEFAULT,
                ALTER COLUMN "status" TYPE "${grnEnum}" USING "status"::text::"${grnEnum}",
                ALTER COLUMN "status" SET DEFAULT 'draft';`,
            { transaction }
        );
        await queryInterface.sequelize.query(`DROP TYPE "${grnEnum}_old";`, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
