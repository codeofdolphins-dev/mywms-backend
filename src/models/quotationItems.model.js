import { DataTypes } from "sequelize";

function QuotationItems(sequelize) {
    return sequelize.define("QuotationItems", {
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requisition_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unit_price: {
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
            type: DataTypes.TEXT
        }
    });

}
export default QuotationItems;
