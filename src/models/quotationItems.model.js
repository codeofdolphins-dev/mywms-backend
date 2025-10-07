import { DataTypes } from "sequelize";

function QuotationItems(sequelize) {
    return sequelize.define("QuotationItems", {
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL,
            defaultValue: 0.00
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });
}
export default QuotationItems;
