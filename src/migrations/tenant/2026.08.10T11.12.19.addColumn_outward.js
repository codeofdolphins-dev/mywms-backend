import { DataTypes } from 'sequelize';

/** Migration: addColumn_outward */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('Outwards', 'vehicle_no', {
            type: DataTypes.STRING,
            allowNull: true
        }, { transaction });

        await queryInterface.addColumn('Outwards', 'tpass_no', {
            type: DataTypes.STRING,
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
        await queryInterface.removeColumn('Outwards', 'tpass_no', { transaction });
        await queryInterface.removeColumn('Outwards', 'vehicle_no', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
