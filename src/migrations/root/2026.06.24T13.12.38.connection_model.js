import { DataTypes } from 'sequelize';

/** Migration: connection_model */

export async function up({ context: queryInterface }) {
    // Write your migration here
    // Example: Add a column
    // await queryInterface.addColumn('Products', 'shelf_life', {
    //     type: DataTypes.INTEGER,
    //     allowNull: true,
    //     defaultValue: 0,
    // });

    // Example: create new table
    await queryInterface.createTable('Connections', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        buyer_node: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_node: {
            type: DataTypes.STRING,
            allowNull: false
        },
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        connection_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        connection_type: {
            type: DataTypes.ENUM("CFA / C&F Agent", "3PL Warehouse", "Super Stockist", "Dealer", "Distributor", "Sub-Distributor", "Retail Warehouse / Backroom Storage"),
            allowNull: false
        },

        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    });
}

export async function down({ context: queryInterface }) {
    // Write the reverse of up() here
    // Example: Remove the column
    // await queryInterface.removeColumn('Products', 'shelf_life');

    // Example: remove new table
    // await queryInterface.dropTable('tableName');
}
