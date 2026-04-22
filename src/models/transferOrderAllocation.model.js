import { DataTypes } from "sequelize";

function TransferOrderAllocation(sequelize) {
    return sequelize.define("TransferOrderAllocation", {
        transferOrder_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        allocated_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        }
    });
}

export default TransferOrderAllocation;