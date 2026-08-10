import { DataTypes } from "sequelize";

function InvoiceItem(sequelize) {
    return sequelize.define("InvoiceItem", {
        // in this model all fields related to seller exclude buyer key

        invoice_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        seller_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        seller_product_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        seller_product_sku: {
            type: DataTypes.STRING,
            allowNull: false
        },

        // null on b2c invoices — a retail customer has no product catalogue to map into
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        buyer_product_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        buyer_product_sku: {
            type: DataTypes.STRING,
            allowNull: true
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
    });
}
export default InvoiceItem;