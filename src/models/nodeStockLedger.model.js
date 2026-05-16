import { DataTypes } from "sequelize";

function NodeStockLedger(sequelize) {
    return sequelize.define("NodeStockLedger", {
        ledger_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        transaction_type: {
            type: DataTypes.ENUM("opening_stock", "internal_transfer", "external_transfer", "others"),
            allowNull: false,
        },
        txn_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        from_location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        from_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
        },

        to_location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        to_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
        },

        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM("transfer_order", "grn", "sales_order", "others"),
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
    });
}
export default NodeStockLedger;