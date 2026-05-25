import { DataTypes } from 'sequelize';

/** Migration: addColumn_CostCenter */

export async function up({ context: queryInterface }) {
    // Write your migration here
    // Example: Add a column
    await queryInterface.addColumn('CostCenters', 'cost_no', {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    });
}

export async function down({ context: queryInterface }) {
    // Write the reverse of up() here
    // Example: Remove the column
    await queryInterface.removeColumn('CostCenters', 'cost_no');
}
