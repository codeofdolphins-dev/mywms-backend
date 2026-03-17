import { DataTypes } from "sequelize";

function NodeStockLedger(sequelize) {
    return sequelize.define("NodeStockLedger", {
        ledger_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        transaction_type: {
            type: DataTypes.ENUM("grn_receipt", "material_issue", "production_receipt", "inter_node_transfer", "sales_dispatch", "purchase_return", "sales_return", "stock_adjustment", "others"),
            allowNull: false,
        },
        ledger_context: {
            type: DataTypes.ENUM("mfg_internal", "mfg_inward", "mfg_outward", "node_transfer", "others"),
            allowNull: false,
        },
        txn_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        from_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        from_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
        },

        to_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
            type: DataTypes.ENUM("production_order", "purchase_order", "grn", "adjustment", "sales_order", "transfer_order"),
            allowNull: true,
        },

        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });
}
export default NodeStockLedger;