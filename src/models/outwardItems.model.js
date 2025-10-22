import { DataTypes } from "sequelize";

function OutwardItems(sequelize) {
    return sequelize.define("OutwardItems", {
        outward_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        uom: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rate: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    });
}
export default OutwardItems;
