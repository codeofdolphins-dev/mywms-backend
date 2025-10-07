import { DataTypes } from "sequelize";

function InvoiceItems(sequelize) {
    return sequelize.define("InvoiceItems", {
        invoice_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL,
            allowNull: true
        },
        gross_amount: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
            defaultValue: 0.00
        },
        discount: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
            defaultValue: 0.00
        },
        taxable_amount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            defaultValue: 0.00
        },
        CGST: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            defaultValue: 0.00
        },
        SGST: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            defaultValue: 0.00
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        }
    });
}
export default InvoiceItems;