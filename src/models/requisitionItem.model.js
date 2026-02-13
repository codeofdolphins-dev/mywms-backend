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
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
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
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    });
}

export default RequisitionItem;
