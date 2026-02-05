import { DataTypes } from "sequelize";

function QuotationItem(sequelize) {
    return sequelize.define("QuotationItem", {
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requisition_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        offer_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        tax_percent: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.00
        },
        total_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

}
export default QuotationItem;
