import { DataTypes } from "sequelize";

function NodeStockLedgerItem(sequelize) {
    return sequelize.define("NodeStockLedgerItem", {
        ledger_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        unit_type: {
            type: DataTypes.STRING,     // kg | litre | pcs | box etc
            allowNull: false,
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
        },
        total_value: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
        },

        balance_after: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
        },
    });
}
export default NodeStockLedgerItem;