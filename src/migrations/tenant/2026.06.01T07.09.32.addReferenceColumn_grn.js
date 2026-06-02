import { DataTypes } from 'sequelize';

/** Migration: addReferenceColumn_grn */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
        // Write your migration here
        await queryInterface.addColumn('GRNs', 'reference', {
            type: DataTypes.JSONB,
            defaultValue: {}
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
        await queryInterface.removeColumn('GRNs', 'reference', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
