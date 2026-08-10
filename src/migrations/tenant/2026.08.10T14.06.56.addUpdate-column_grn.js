import { DataTypes } from 'sequelize';

/** Migration: addUpdate-column_grn */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        /** Write your migration here */

        /** Example: Add a column */
        // await queryInterface.addColumn('Products', 'shelf_life', {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        //     defaultValue: 0,
        // }, { transaction });

        /** Example: create new table */
        // await queryInterface.createTable('tableName', {
        //     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        //     createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        //     updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        // }, { transaction })

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        /** Write the reverse of up() here */

        /** Example: Remove the column */
        // await queryInterface.removeColumn('Products', 'shelf_life', { transaction });

        /** Example: remove new table */
        // await queryInterface.dropTable('tableName', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
