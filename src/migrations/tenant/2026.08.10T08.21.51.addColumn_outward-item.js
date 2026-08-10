import { DataTypes } from 'sequelize';

/** Migration: addColumn_outward-item */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('Outwards', 'total_price', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        }, { transaction });

        await queryInterface.removeColumn('OutwardItems', 'unit_price', { transaction });
        await queryInterface.addColumn('OutwardItems', 'line_total_price', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        }, { transaction });

        await queryInterface.addColumn('OutwardAllocations', 'unit_price', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
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
        await queryInterface.removeColumn('OutwardAllocations', 'unit_price', { transaction });

        await queryInterface.removeColumn('OutwardItems', 'line_total_price', { transaction });
        await queryInterface.addColumn('OutwardItems', 'unit_price', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        }, { transaction });

        await queryInterface.removeColumn('Outwards', 'total_price', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
