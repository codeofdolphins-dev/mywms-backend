import { DataTypes } from "sequelize";

function RequisitionItem(sequelize) {
    return sequelize.define("RequisitionItem", {
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sub_category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        priceLimit: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    });
}

export default RequisitionItem;
