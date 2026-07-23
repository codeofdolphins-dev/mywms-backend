import { DataTypes } from 'sequelize';

/** Migration: intercompanyRequisitionOrders */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.createTable('IntercompanyRequisitions', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            requisition_no: {
                type: DataTypes.STRING,
                unique: true
            },
            connection_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Connections', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            buyer_node: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false
            },
            notes: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            required_by_date: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM("pending", "dispatched", "cancelled", "closed"),
                defaultValue: "pending"
            },
            priority: {
                type: DataTypes.ENUM("low", "normal", "high"),
                defaultValue: "normal"
            },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });


        await queryInterface.createTable('IntercompanyRequisitionItems', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            inter_comp_req_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'IntercompanyRequisitions', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            product_mapping_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'ProductMappings', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            brand: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            category: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            sub_category: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction })

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.dropTable('IntercompanyRequisitionItems', { transaction });
        await queryInterface.dropTable('IntercompanyRequisitions', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
