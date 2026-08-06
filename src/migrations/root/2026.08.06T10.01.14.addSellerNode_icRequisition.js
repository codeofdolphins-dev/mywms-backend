import { DataTypes } from 'sequelize';

/** Migration: addSellerNode_icRequisition */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('IntercompanyRequisitions', 'seller_node', {
            type: DataTypes.INTEGER,
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
        await queryInterface.removeColumn('IntercompanyRequisitions', 'seller_node', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
