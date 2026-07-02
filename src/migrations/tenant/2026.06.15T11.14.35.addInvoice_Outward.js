import { DataTypes } from 'sequelize';

/** Migration: addInvoice_Outward */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('Outwards', 'invoice_no', {
            type: DataTypes.STRING,
            allowNull: true
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.removeColumn('Outwards', 'invoice_no', { transaction });
        
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error
    }
}
