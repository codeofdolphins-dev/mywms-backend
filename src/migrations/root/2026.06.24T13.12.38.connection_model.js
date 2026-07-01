import { DataTypes } from 'sequelize';

/** Migration: connection_model */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        // Create Connections table (IF NOT EXISTS — safe to re-run)
        await queryInterface.createTable('Connections', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

            parent_tenant: {
                type: DataTypes.STRING,
                allowNull: false
            },
            child_tenant: {
                type: DataTypes.STRING,
                allowNull: false
            },
            connection_status: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            connection_type: {
                type: DataTypes.ENUM("cfa / c&f agent", "3pl warehouse", "super stockist", "dealer", "distributor", "sub-distributor", "retail warehouse / backroom storage", "supplier", "pending"),
                allowNull: false
            },

            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });


        // Add connection_id FK
        await queryInterface.addColumn("ProductMappings", "connection_id", {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Connections", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    // Drop the Connections table last (no more FK references pointing to it)
    try {
        await queryInterface.dropTable('Connections', { transaction });
        await queryInterface.removeColumn('ProductMappings', 'connection_id', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
