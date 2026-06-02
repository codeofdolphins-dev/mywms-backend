import { DataTypes } from 'sequelize';

/** Migration: addColumn_CostCenter */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        // Write your migration here
        // Example: Add a column
        await queryInterface.addColumn('CostCenters', 'cost_no', {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        // Write the reverse of up() here
        // Example: Remove the column
        await queryInterface.removeColumn('CostCenters', 'cost_no', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
