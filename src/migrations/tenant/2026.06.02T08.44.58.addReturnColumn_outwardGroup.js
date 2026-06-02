import { DataTypes } from 'sequelize';

/** Migration: addReturnColumn_outwardGroup */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();
    // Write your migration here

    try {
        /** OutwardItems */
        await queryInterface.addColumn('OutwardItems', 'total_shortage_qty', {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        }, { transaction });

        await queryInterface.addColumn('OutwardItems', 'total_damage_qty', {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        }, { transaction });


        /** OutwardAllocations */
        await queryInterface.addColumn('OutwardAllocations', 'shortage_qty', {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        }, { transaction });
        await queryInterface.addColumn('OutwardAllocations', 'damage_qty', {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error

    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();
    
    // Write the reverse of up() here
    try {
        await queryInterface.removeColumn('OutwardItems', 'total_shortage_qty', { transaction });
        await queryInterface.removeColumn('OutwardItems', 'total_damage_qty', { transaction });
        await queryInterface.removeColumn('OutwardAllocations', 'shortage_qty', { transaction });
        await queryInterface.removeColumn('OutwardAllocations', 'damage_qty', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error
    }
}
