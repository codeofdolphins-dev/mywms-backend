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
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        quantity_ordered: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        unit_price: {
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
