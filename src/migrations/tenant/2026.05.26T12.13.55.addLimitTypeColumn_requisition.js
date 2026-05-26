import { DataTypes } from 'sequelize';

/** Migration: addLimitTypeColumn_requisition */

export async function up({ context: queryInterface }) {
    await queryInterface.addColumn('Requisitions', 'price_limit_type', {
        type: DataTypes.ENUM("upper_limit", "lower_limit"),
        allowNull: true
    });
}

export async function down({ context: queryInterface }) {
    await queryInterface.removeColumn('Requisitions', 'price_limit_type');
}
