import { DataTypes } from 'sequelize';

/** Migration: create-direct-transfer-models */

export async function up({ context: queryInterface }) {
    // Create Direct transfers table
    await queryInterface.createTable('DirectTransfers', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, },
        tenant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Tenants',
                key: 'id',
            },
        },
        from_facility_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Facilities',
                key: 'id',
            },
        },
        to_facility_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Facilities',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('pending', 'sent', 'received', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending',
        },
        total_items: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    });

    // Create Direct Transfer Items table
    await queryInterface.createTable('DirectTransferItems', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        transfer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'DirectTransfers',
                key: 'id',
            },
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Products',
                key: 'id',
            },
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Batches',
                key: 'id',
            },
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        sku: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        item_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
}

export async function down({ context: queryInterface }) {
    // Drop tables in reverse order
    await queryInterface.dropTable('DirectTransferItems');
    await queryInterface.dropTable('DirectTransfers');
    // await queryInterface.removeColumn('Products', 'shelf_life');
}
