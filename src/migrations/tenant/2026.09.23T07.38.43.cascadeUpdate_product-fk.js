/** Migration: cascadeUpdate_product-fk — Products FKs keyed by master names/codes were ON UPDATE SET NULL,
 * so renaming a package type / unit type / HSN code wiped it from every product. Make them ON UPDATE CASCADE. */

const PRODUCT_FKS = [
    { column: 'hsn_code', refTable: 'HSNs', refColumn: 'hsn_code' },
    { column: 'package_type', refTable: 'PackageTypes', refColumn: 'name' },
    { column: 'unit_type', refTable: 'UnitTypes', refColumn: 'name' },
];

async function replaceProductFk(queryInterface, transaction, { column, refTable, refColumn }, onUpdate) {
    // drop whichever FK currently sits on the column, whatever it is named
    const [existing] = await queryInterface.sequelize.query(`
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
        WHERE con.contype = 'f' AND con.conrelid = '"Products"'::regclass AND a.attname = :column
    `, { replacements: { column }, transaction });

    for (const { conname } of existing) {
        await queryInterface.sequelize.query(`ALTER TABLE "Products" DROP CONSTRAINT "${conname}"`, { transaction });
    }

    await queryInterface.sequelize.query(`
        ALTER TABLE "Products"
        ADD CONSTRAINT "Products_${column}_fkey"
        FOREIGN KEY ("${column}") REFERENCES "${refTable}" ("${refColumn}")
        ON DELETE CASCADE ON UPDATE ${onUpdate}
    `, { transaction });
}

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        for (const fk of PRODUCT_FKS) {
            await replaceProductFk(queryInterface, transaction, fk, 'CASCADE');
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
        for (const fk of PRODUCT_FKS) {
            await replaceProductFk(queryInterface, transaction, fk, 'SET NULL');
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
