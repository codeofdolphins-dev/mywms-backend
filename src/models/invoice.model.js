import { DataTypes } from "sequelize";

function Invoice(sequelize) {
    return sequelize.define("Invoice", {
        po_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        invoice_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        invoice_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("Pending", "Verified", "Partially Paid", "Paid", "Cancelled"),
            defaultValue: "Pending"
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        total: {
            type: DataTypes.DECIMAL,
            defaultValue: 0.00,
            allowNull: true
        }
    });
}
export default Invoice;
