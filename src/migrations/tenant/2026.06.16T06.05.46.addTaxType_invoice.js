import { DataTypes } from 'sequelize';

/** Migration: addTaxType_invoice */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('Invoices', 'tax_type', {
            type: DataTypes.ENUM("intra", "inter", "noTax"),
            allowNull: false,
            defaultValue: "noTax",
        }, { transaction });

        await queryInterface.removeColumn('InvoiceItems', 'tax_type', { transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.removeColumn('Invoices', 'tax_type', { transaction });

        await queryInterface.addColumn('InvoiceItems', 'tax_type', {
            type: DataTypes.ENUM("intra", "inter", "noTax"),
            allowNull: false,
            defaultValue: "noTax",
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error
    }
}
