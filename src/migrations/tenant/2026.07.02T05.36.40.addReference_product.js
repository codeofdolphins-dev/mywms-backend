import { DataTypes } from 'sequelize';

/** Migration: addLinkedVendor_product */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('Products', 'linked_vendor', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Vendors',
                key: 'id'
            },
            onDelete: "SET NULL"
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
        await queryInterface.removeColumn('Products', 'linked_vendor', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
