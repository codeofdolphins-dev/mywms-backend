import { DataTypes } from "sequelize";

function GRNItem(sequelize) {
    return sequelize.define("GRNItem", {
        grn_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        purchase_order_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ordered_qty: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
            defaultValue: 0
        },
        shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        damage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        received_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        }
    });

}
export default GRNItem;