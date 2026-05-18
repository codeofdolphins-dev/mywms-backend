import { DataTypes } from "sequelize";

function DirectTransferAllocation(sequelize) {
    return sequelize.define("DirectTransferAllocation", {
        dir_transfer_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        damage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        send_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
    });

}
export default DirectTransferAllocation;