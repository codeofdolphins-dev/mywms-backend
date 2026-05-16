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
        demaged_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        allocated_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        }
    });
}

export default TransferOrderAllocation;