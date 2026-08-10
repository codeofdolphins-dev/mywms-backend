import { DataTypes } from 'sequelize';

/** Migration: addRetailFields_invoice
 *
 * Lets the existing Invoice register carry b2c (retail / POS) invoices alongside b2b:
 *  - Invoices.invoice_type discriminator + retail_sale_id source link (mirrors outward_id)
 *  - buyer columns become nullable — a retail customer has no tenant, node, or product catalogue
 */

export async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('Invoices', 'invoice_type', {
            type: DataTypes.ENUM("b2b", "b2c"),
            allowNull: false,
            defaultValue: "b2b",        // every pre-existing invoice is b2b
        }, { transaction });

        await queryInterface.addColumn('Invoices', 'retail_sale_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'RetailSales', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',       // an invoice is a tax document — deleting the sale must fail loudly
        }, { transaction });

        await queryInterface.changeColumn('Invoices', 'buyer_tenant', {
            type: DataTypes.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.changeColumn('Invoices', 'buyer_businessNode_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, { transaction });

        await queryInterface.changeColumn('InvoiceItems', 'buyer_product_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, { transaction });
        await queryInterface.changeColumn('InvoiceItems', 'buyer_product_name', {
            type: DataTypes.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.changeColumn('InvoiceItems', 'buyer_product_sku', {
            type: DataTypes.STRING,
            allowNull: true,
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
        /** b2c rows can not exist in the old NOT NULL schema — remove them before tightening back */
        await queryInterface.sequelize.query(
            `DELETE FROM "InvoiceItems" WHERE "invoice_id" IN
                (SELECT "id" FROM "Invoices" WHERE "invoice_type" = 'b2c');`,
            { transaction }
        );
        await queryInterface.sequelize.query(
            `DELETE FROM "Invoices" WHERE "invoice_type" = 'b2c';`,
            { transaction }
        );

        await queryInterface.changeColumn('InvoiceItems', 'buyer_product_sku', {
            type: DataTypes.STRING,
            allowNull: false,
        }, { transaction });
        await queryInterface.changeColumn('InvoiceItems', 'buyer_product_name', {
            type: DataTypes.STRING,
            allowNull: false,
        }, { transaction });
        await queryInterface.changeColumn('InvoiceItems', 'buyer_product_id', {
            type: DataTypes.INTEGER,
            allowNull: false,
        }, { transaction });

        await queryInterface.changeColumn('Invoices', 'buyer_businessNode_id', {
            type: DataTypes.INTEGER,
            allowNull: false,
        }, { transaction });
        await queryInterface.changeColumn('Invoices', 'buyer_tenant', {
            type: DataTypes.STRING,
            allowNull: false,
        }, { transaction });

        await queryInterface.removeColumn('Invoices', 'retail_sale_id', { transaction });
        await queryInterface.removeColumn('Invoices', 'invoice_type', { transaction });
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_Invoices_invoice_type";`, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
