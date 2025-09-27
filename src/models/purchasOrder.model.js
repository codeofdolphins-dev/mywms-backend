import { DataTypes } from "sequelize";

function PurchasOrder(sequelize) {
    return sequelize.define("PurchasOrder", {
        pr_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("draft", "sent", "confirmed", "partially received", "completed", "cancelled"),
            defaultValue: "draft"
        },
        priority: {
            type: DataTypes.ENUM("low", "normal", "high"),
            defaultValue: "normal"
        },
        expected_delivery_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
    });
}
export default PurchasOrder;
