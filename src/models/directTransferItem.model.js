import { DataTypes } from "sequelize";

function DirectTransfer(sequelize) {
    return sequelize.define("DirectTransfer", {
        transfer_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        total_damage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        total_shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        total_send_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
    });

}
export default DirectTransfer;