import { DataTypes } from "sequelize";

function RFQItem(sequelize) {
    return sequelize.define("RFQItem", {
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_name: {
            type: DataTypes.STRING,
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
        price_limit: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: true
        }
    });
}

export default RFQItem;