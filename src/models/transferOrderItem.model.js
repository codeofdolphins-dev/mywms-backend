import { DataTypes } from "sequelize";

function TransferOrderItem(sequelize) {
    return sequelize.define("TransferOrderItem", {
        transfer_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        requested_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        dispatched_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        received_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    });

}
export default TransferOrderItem;