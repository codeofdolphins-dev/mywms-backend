import { DataTypes } from "sequelize";

function SalesOrderItem(sequelize) {
    return sequelize.define("SalesOrderItem", {
        sales_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        line_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
            defaultValue: 0.00
        }
    });
}
export default SalesOrderItem;
