import { DataTypes } from "sequelize";

function Batch(sequelize) {
    return sequelize.define("Batch", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        batch_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        cost_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }
    })
}
export default Batch;