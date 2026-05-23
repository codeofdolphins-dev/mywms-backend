import { DataTypes } from 'sequelize';

/** Migration: costCenter */

export async function up({ context: queryInterface }) {
    await queryInterface.createTable('CostCategories', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "CostCategories", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE"
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "BusinessNodes", key: "id", },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    })

    await queryInterface.createTable('CostCenters', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "BusinessNodes", key: "id", },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        costHead_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "CostCategories", key: "id", },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        costSubHead_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "CostCategories", key: "id", },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        type: {
            type: DataTypes.ENUM("monthly", "onetime", "yearly"),
            defaultValue: "monthly",
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
            allowNull: false
        },
        creator_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id", },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        cost_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    })
}

export async function down({ context: queryInterface }) {
    await queryInterface.dropTable('CostCategories');
    await queryInterface.dropTable('CostCenters');
}
