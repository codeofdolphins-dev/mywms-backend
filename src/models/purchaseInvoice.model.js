import { DataTypes } from "sequelize";

function PurchaseInvoice(sequelize) {
    return sequelize.define("PurchaseInvoice", {
        po_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        invoice_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        invoice_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        subtotal: {
            type: DataTypes.DECIMAL(10,2),
            allowNull: true,
            defaultValue: 0.00
        },
        tax_amount: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            defaultValue: 0.00
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        status: {
            type: DataTypes.ENUM("Pending", "Verified", "Partially Paid", "Paid", "Cancelled"),
            defaultValue: "Pending"
        }
    });
}
export default PurchaseInvoice;
