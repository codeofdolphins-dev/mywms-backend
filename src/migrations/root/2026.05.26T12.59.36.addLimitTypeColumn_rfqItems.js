import { DataTypes } from 'sequelize';

/** Migration: addLimitTypeColumn_rfqItems */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        await queryInterface.addColumn('RFQItems', 'price_limit_type', {
            type: DataTypes.ENUM('upper_limit', 'lower_limit'),
            allowNull: true
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
        await queryInterface.removeColumn('RFQItems', 'price_limit_type', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
