import { DataTypes } from "sequelize";

function QuotationItem(sequelize) {
    return sequelize.define("QuotationItem", {
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rfq_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        offer_price: {
            type: DataTypes.DECIMAL,
            allowNull: true,
        },
    });
}

export default QuotationItem;