import { DataTypes } from "sequelize";

function RfqQuotationItem(sequelize) {
    return sequelize.define("RfqQuotationItem", {
        revision_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rfq_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_map_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        offer_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
        }
    });
}

export default RfqQuotationItem;