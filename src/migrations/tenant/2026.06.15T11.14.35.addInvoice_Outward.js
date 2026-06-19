import { DataTypes } from 'sequelize';

/** Migration: addInvoice_Outward */

export async function up({ context: queryInterface }) {
    await queryInterface.addColumn('Outwards', 'invoice_no', {
        type: DataTypes.STRING,
        allowNull: true
    });
}

export async function down({ context: queryInterface }) {
    await queryInterface.removeColumn('Outwards', 'invoice_no');
}
