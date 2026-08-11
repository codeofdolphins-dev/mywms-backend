import { DataTypes } from 'sequelize';

/** Migration: addPrice-columns_grn — mirror outward pricing on inward (GRN) records */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('GRNs', 'total_price', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        }, { transaction });

        await queryInterface.addColumn('GRNItems', 'line_total_price', {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        }, { transaction });

        await queryInterface.addColumn('GRNItemBatches', 'unit_price', {
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
        await queryInterface.removeColumn('GRNItemBatches', 'unit_price', { transaction });
        await queryInterface.removeColumn('GRNItems', 'line_total_price', { transaction });
        await queryInterface.removeColumn('GRNs', 'total_price', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
