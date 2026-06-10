import { DataTypes } from 'sequelize';

/** Migration: invoiceModel_add */

export async function up({ context: queryInterface }) {
    // Write your migration here
    await queryInterface.createTable('Invoices', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        buyer_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'BusinessNodes',
                key: 'id',
            },
        },
        invoice_no: {
            type: DataTypes.STRING,
            unique: true,
        },
        invoice_date: {
            type: DataTypes.DATE,
        },
        sub_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        total_tax_amount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        discount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },

        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    })

    await queryInterface.createTable('InvoiceItems', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

        invoice_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Invoices',
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
        hsn_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        qty: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        itemLevel_sub_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        tax_rate: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        tax_amount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        itemLevel_grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },        

        createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    })
}

export async function down({ context: queryInterface }) {
    // Write the reverse of up() here

    await queryInterface.dropTable('Invoices');
    await queryInterface.dropTable('InvoiceItems');
}
