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
    const outwardEnum = await getStatusEnumName(queryInterface, 'Outwards');

    // enum ADD VALUE can not run inside a transaction block
    await queryInterface.sequelize.query(`ALTER TYPE "${grnEnum}" ADD VALUE IF NOT EXISTS 'return';`);
    await queryInterface.sequelize.query(`ALTER TYPE "${outwardEnum}" ADD VALUE IF NOT EXISTS 'return';`);

    const transaction = await queryInterface.sequelize.transaction();

    try {
        /** batch level shortage — GRNItemBatches only ever tracked damage */
        await queryInterface.addColumn('GRNItemBatches', 'shortage_qty', {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down({ context: queryInterface }) {
    const grnEnum = await getStatusEnumName(queryInterface, 'GRNs');
    const outwardEnum = await getStatusEnumName(queryInterface, 'Outwards');
    const transaction = await queryInterface.sequelize.transaction();

    // Postgres can not drop a single enum value — move rows off the value and rebuild the type
    try {
        await queryInterface.removeColumn('GRNItemBatches', 'shortage_qty', { transaction });

        /** GRNs */
        await queryInterface.sequelize.query(
            `UPDATE "GRNs" SET "status" = 'accepted' WHERE "status" = 'return';`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `ALTER TYPE "${grnEnum}" RENAME TO "${grnEnum}_old";`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `CREATE TYPE "${grnEnum}" AS ENUM ('draft', 'accepted', 'cancelled');`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `ALTER TABLE "GRNs"
                ALTER COLUMN "status" DROP DEFAULT,
                ALTER COLUMN "status" TYPE "${grnEnum}" USING "status"::text::"${grnEnum}",
                ALTER COLUMN "status" SET DEFAULT 'accepted';`,
            { transaction }
        );
        await queryInterface.sequelize.query(`DROP TYPE "${grnEnum}_old";`, { transaction });

        /** Outwards */
        await queryInterface.sequelize.query(
            `UPDATE "Outwards" SET "status" = 'dispatched' WHERE "status" = 'return';`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `ALTER TYPE "${outwardEnum}" RENAME TO "${outwardEnum}_old";`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `CREATE TYPE "${outwardEnum}" AS ENUM ('pending', 'picking', 'picked', 'cancelled', 'dispatched');`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `ALTER TABLE "Outwards"
                ALTER COLUMN "status" DROP DEFAULT,
                ALTER COLUMN "status" TYPE "${outwardEnum}" USING "status"::text::"${outwardEnum}",
                ALTER COLUMN "status" SET DEFAULT 'pending';`,
            { transaction }
        );
        await queryInterface.sequelize.query(`DROP TYPE "${outwardEnum}_old";`, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
