import { DataTypes } from 'sequelize';

/** Migration: create_retailSale */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.createTable('Customers', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

            f_name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            l_name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            ph_no: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            gstin: {
                type: DataTypes.STRING,
                allowNull: true
            },

            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });

        await queryInterface.createTable('RetailSales', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

            sale_no: {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            },
            business_node_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'BusinessNodes', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            cashier_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'    // NOT NULL column — SET NULL would blow up on user delete
            },
            customer_id: {
                type: DataTypes.INTEGER,
                allowNull: true,        // anonymous walk-in sales have no customer record
                references: { model: "Customers", key: "id" },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            status: {
                type: DataTypes.ENUM("completed", "void", "returned"),
                allowNull: true
            },
            sub_total: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false
            },
            tax_type: {
                type: DataTypes.ENUM("inter", "intra", "noTax"),
                allowNull: false
            },
            total_tax_amount: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false
            },
            discount: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false
            },
            grand_total: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false
            },
            payment_mode: {
                type: DataTypes.ENUM("cash", "card", "upi"),
                allowNull: false
            },
            payment_details: {
                type: DataTypes.JSONB,
                allowNull: true
            },

            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });

        await queryInterface.createTable('RetailSaleItems', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

            sale_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "RetailSales", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "Products", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT"    // sale history must survive product deletion attempts
            },
            total_qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            unit_price: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: true,
            },
            tax_rate: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: true,
            },
            tax_amount: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
            },
            line_total: {
                type: DataTypes.DECIMAL(18, 2),
                allowNull: false,
            },

            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });

        await queryInterface.createTable('RetailSaleAllocations', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

            sale_item_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "RetailSaleItems", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE"
            },
            batch_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: "Batches", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT"    // allocation is the expiry/recall trail — must outlive the batch row
            },
            qty: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },

            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
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
        await queryInterface.dropTable('RetailSaleAllocations', { transaction });
        await queryInterface.dropTable('RetailSaleItems', { transaction });
        await queryInterface.dropTable('RetailSales', { transaction });
        await queryInterface.dropTable('Customers', { transaction });

        /** dropTable leaves the enum types behind — created by this migration, so names are deterministic */
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_RetailSales_status";`, { transaction });
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_RetailSales_tax_type";`, { transaction });
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_RetailSales_payment_mode";`, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
