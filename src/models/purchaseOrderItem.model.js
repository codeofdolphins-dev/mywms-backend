import { DataTypes } from "sequelize";

function PurchaseOrderItem(sequelize) {
    return sequelize.define("PurchaseOrderItem", {
        purchase_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        bpo_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Only filled if generated from BPO
        },
        buyer_product_id: {
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
        tax_percent: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true
        },
        line_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: true,
            defaultValue: 0.00
        }
    });
}
export default PurchaseOrderItem;
