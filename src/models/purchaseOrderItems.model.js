import { DataTypes } from "sequelize";

function PurchaseOrderItems(sequelize) {
    return sequelize.define("PurchaseOrderItems", {
        po_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        quantity_ordered: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        tax_percent: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        line_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        }
    });
}
export default PurchaseOrderItems;
