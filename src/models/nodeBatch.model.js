import { DataTypes } from "sequelize";

function NodeBatch(sequelize) {
    return sequelize.define("NodeBatch", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batch_no: {
            type: DataTypes.STRING,
            allowNull: false
        },
        purchase_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        available_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        mfg_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM("grn", "transfer"),
            allowNull: true,
        }
    });
}
export default NodeBatch;