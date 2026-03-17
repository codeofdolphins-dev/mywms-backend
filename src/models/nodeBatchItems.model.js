import { DataTypes } from "sequelize";

function NodeBatchItems(sequelize) {
    return sequelize.define("NodeBatchItems", {
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        available_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reserved_qty: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: false,
        },
        mfg_date: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.ENUM("grn", "production"),
            allowNull: true,
        },
        unit_price: {
            type: DataTypes.ENUM("active", "quarantine", "expired", "consumed"),
            allowNull: true,
        },
    });
}
export default NodeBatchItems;