import { DataTypes } from "sequelize";

function RFQ(sequelize) {
    return sequelize.define("RFQ", {
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_name: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        uom: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        priceLimit: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: true
        },
    });
}

export default RFQ;