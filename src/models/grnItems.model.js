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
            type: DataTypes.DECIMAL(12, 3),
            allowNull: false
        },
        received_qty: {
            type: DataTypes.DECIMAL(12, 3),
            allowNull: false
        }
    });

}
export default GRNItem;