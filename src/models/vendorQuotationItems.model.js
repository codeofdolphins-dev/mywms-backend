import { DataTypes } from "sequelize";

function VendorQuotationItems(sequelize) {
    return sequelize.define("VendorQuotationItems", {
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
        tax_percent: {
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
export default VendorQuotationItems;
