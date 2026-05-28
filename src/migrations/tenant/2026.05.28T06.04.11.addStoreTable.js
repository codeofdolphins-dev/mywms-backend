import { DataTypes } from 'sequelize';

/** Migration: addStoreTable */

export async function up({ context: queryInterface }) {

    await queryInterface.createTable('Stores', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        store_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        node_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'BusinessNodes', key: 'id' },
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    })
}

export async function down({ context: queryInterface }) {
    await queryInterface.dropTable('Stores');
}
