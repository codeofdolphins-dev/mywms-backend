import { DataTypes } from "sequelize";

function PurchasOrder(sequelize) {
    return sequelize.define("PurchasOrder", {
        status: {
            type: DataTypes.ENUM("Draft", "Sent", "Confirmed", "Partially Received", "Completed", "Cancelled"),
            defaultValue: "Draft"
        },
        priority: {
            type: DataTypes.ENUM("Low", "Normal", "High"),
            defaultValue: "Normal"
        },
        expected_delivery_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
    });
}
export default PurchasOrder;
