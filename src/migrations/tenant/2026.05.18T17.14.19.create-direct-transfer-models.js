import { DataTypes } from 'sequelize';

/** Migration: create-direct-transfer-models */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();
    try {

        await queryInterface.createTable('DirectTransfers', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, },
            dir_trans_no: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: true
            },
            from_location_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'BusinessNodes', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            from_mfg_unit_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'ManufacturingUnits', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            target_location_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'BusinessNodes', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            transfer_date: {
                type: DataTypes.DATEONLY,
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM("draft", "send", "accepted", "return", "cancelled"),
                defaultValue: "send"
            },
            created_by: {
                type: DataTypes.INTEGER,
                references: { model: 'Users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });


        await queryInterface.createTable('DirectTransferItems', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, },
            dir_transfer_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'DirectTransfers', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Products', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            total_damage_qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            total_shortage_qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            total_send_qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            is_return: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });


        await queryInterface.createTable("DirectTransferAllocations", {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            dir_transfer_item_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'DirectTransferItems', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            batch_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Batches', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            damage_qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            shortage_qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            send_qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            },
            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
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
        await queryInterface.dropTable('DirectTransferAllocations', { transaction });
        await queryInterface.dropTable('DirectTransferItems', { transaction });
        await queryInterface.dropTable('DirectTransfers', { transaction })

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
