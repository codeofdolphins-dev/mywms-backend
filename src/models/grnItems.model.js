import { DataTypes } from "sequelize";

function GRNItem(sequelize) {
    return sequelize.define("GRNItem", {
        grn_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        purchase_order_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ordered_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        shortage_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        damage_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        received_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        mfg_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    });

}
export default GRNItem;