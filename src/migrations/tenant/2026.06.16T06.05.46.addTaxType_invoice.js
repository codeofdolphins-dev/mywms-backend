import { DataTypes } from 'sequelize';

/** Migration: addTaxType_invoice */

export async function up({ context: queryInterface }) {
    await queryInterface.addColumn('Invoices', 'tax_type', {
        type: DataTypes.ENUM("intra", "inter", "noTax"),
        allowNull: false,
        defaultValue: "noTax",
    });
    await queryInterface.removeColumn('InvoiceItems', 'tax_type');
}

export async function down({ context: queryInterface }) {
    await queryInterface.removeColumn('Invoices', 'tax_type');
}
