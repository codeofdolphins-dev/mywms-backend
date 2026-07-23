/** Migration: addAssignFgStatus_icRequisition */

/** enum type name differs per environment (sync vs migration created) — resolve it from the column itself */
async function getStatusEnumName(queryInterface) {
    const [[col]] = await queryInterface.sequelize.query(
        `SELECT udt_name FROM information_schema.columns
         WHERE table_name = 'IntercompanyRequisitions' AND column_name = 'status';`
    );
    if (!col?.udt_name) throw new Error("IntercompanyRequisitions.status enum type not found!!!");
    return col.udt_name;
}

export async function up({ context: queryInterface }) {
    const enumName = await getStatusEnumName(queryInterface);

    // enum ADD VALUE can not run inside a transaction block
    await queryInterface.sequelize.query(
        `ALTER TYPE "${enumName}" ADD VALUE IF NOT EXISTS 'assign_fg';`
    );
}

export async function down({ context: queryInterface }) {
    const enumName = await getStatusEnumName(queryInterface);
    const transaction = await queryInterface.sequelize.transaction();

    // Postgres can not drop a single enum value — move rows off the value and rebuild the type
    try {
        await queryInterface.sequelize.query(
            `UPDATE "IntercompanyRequisitions" SET "status" = 'pending' WHERE "status" = 'assign_fg';`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `ALTER TYPE "${enumName}" RENAME TO "${enumName}_old";`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `CREATE TYPE "${enumName}" AS ENUM ('pending', 'dispatched', 'cancelled', 'closed');`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `ALTER TABLE "IntercompanyRequisitions"
                ALTER COLUMN "status" DROP DEFAULT,
                ALTER COLUMN "status" TYPE "${enumName}" USING "status"::text::"${enumName}",
                ALTER COLUMN "status" SET DEFAULT 'pending';`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `DROP TYPE "${enumName}_old";`,
            { transaction }
        );

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
