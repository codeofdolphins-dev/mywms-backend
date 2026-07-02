import { DataTypes } from 'sequelize';

/** Migration: invoiceModel_add */

export async function up({ context: queryInterface }) {


    const transaction = await queryInterface.sequelize.transaction();
    // Write your migration here

    try {
        await queryInterface.createTable('Invoices', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

            seller_tenant: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            seller_businessNode_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            seller_store_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },


            buyer_tenant: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            buyer_businessNode_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            // buyer_store_id: {
            //     type: DataTypes.INTEGER,
            //     allowNull: true,
            // },


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

            outward_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'Outwards',
                    key: 'id',
                },
            },

            createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
            updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        }, { transaction });

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

            seller_product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Products',
                    key: 'id',
                },
            },
            seller_product_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            seller_product_sku: {
                type: DataTypes.STRING,
                allowNull: false
            },

            buyer_product_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            buyer_product_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            buyer_product_sku: {
                type: DataTypes.STRING,
                allowNull: false
            },

            hsn_code: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            batch_no: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            mfg_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            expiry_date: {
                type: DataTypes.DATE,
                allowNull: true,
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
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0.00,
            },
            tax_type: {
                type: DataTypes.ENUM("intra", "inter", "noTax"),
                allowNull: false,
                defaultValue: "noTax",
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
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error
    }
}

export async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    // Write the reverse of up() here
    try {
        await queryInterface.dropTable('Invoices', { transaction });
        await queryInterface.dropTable('InvoiceItems', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error
    }
}
