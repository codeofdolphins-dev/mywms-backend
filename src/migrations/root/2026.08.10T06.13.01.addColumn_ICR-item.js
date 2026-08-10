import { DataTypes } from 'sequelize';

/** Migration: addColumn_ICR-item */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('IntercompanyRequisitions', 'total_price', {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        }, { transaction });

        await queryInterface.addColumn('IntercompanyRequisitionItems', 'line_total_price', {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
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
        await queryInterface.removeColumn('IntercompanyRequisitionItems', 'line_total_price', { transaction });
        await queryInterface.removeColumn('IntercompanyRequisitions', 'total_price', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
