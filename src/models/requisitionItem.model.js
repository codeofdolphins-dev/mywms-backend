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

        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        sub_category_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    });
}

export default RequisitionItem;
