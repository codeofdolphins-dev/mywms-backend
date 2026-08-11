import { DataTypes } from "sequelize";

function GRNItemBatch(sequelize) {
    return sequelize.define("GRNItemBatch", {
        grn_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false           // FK → GRNItem
        },
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true            // supplier's batch number if available
        },
        received_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0            // qty in THIS batch
        },
        damage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        }
    });
}
export default GRNItemBatch;