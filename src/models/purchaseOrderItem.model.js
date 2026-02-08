import { DataTypes } from "sequelize";

function PurchaseOrderItem(sequelize) {
    return sequelize.define("PurchaseOrderItem", {
        purchase_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requisition_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        unit_price: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        tax_percent: {
            type: DataTypes.DECIMAL,
            allowNull: true
        },
        line_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        }
    });
}
export default PurchaseOrderItem;
