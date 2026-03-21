import { DataTypes } from "sequelize";

function PurchaseOrderItem(sequelize) {
    return sequelize.define("PurchaseOrderItem", {
        purchase_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requisition_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        bpo_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Only filled if generated from BPO
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false // Must know what product this line item represents
        },
        qty: {
            type: DataTypes.DECIMAL(10, 3), // 3 decimal places for RM precision (e.g., 1.500 kg)
            allowNull: false,
            defaultValue: 0.000
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
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
