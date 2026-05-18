import { DataTypes } from "sequelize";

function DirectTransferItem(sequelize) {
    return sequelize.define("DirectTransferItem", {
        dir_transfer_id: {
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
        is_return: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });

}
export default DirectTransferItem;