import { DataTypes } from "sequelize";

function RetailsSaleItem(sequelize) {
    return sequelize.define("RetailsSaleItem", {
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
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        tax_rate: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        tax_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        line_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        }
    });
}

export default RetailsSaleItem;