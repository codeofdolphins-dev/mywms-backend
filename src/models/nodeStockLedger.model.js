import { DataTypes } from "sequelize";

function NodeStockLedger (sequelize) {
    return sequelize.define("NodeStockLedger", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        from_node_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        to_node_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        source_batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        transaction_type  : {
            type: DataTypes.ENUM("inward", "outward", "transfer"),
            allowNull: false,
        },
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM("po", "grn", "adjustment", "opening"),
            allowNull: true,
        }
    });
}
export default NodeStockLedger;