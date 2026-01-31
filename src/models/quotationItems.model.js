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
        req_qty: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        approve_qty: {
            type: DataTypes.INTEGER,
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
