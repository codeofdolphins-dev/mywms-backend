import { DataTypes } from "sequelize";

function RetailSaleItem(sequelize) {
    return sequelize.define("RetailSaleItem", {
        sale_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        total_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
        },
        tax_rate: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        tax_amount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
        },
        line_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
        }
    });
}

export default RetailSaleItem;