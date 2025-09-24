import { DataTypes } from "sequelize";

function PurchaseInvoiceItems(sequelize) {
    return sequelize.define("PurchaseInvoiceItems", {
        invoice_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        po_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity_invoiced: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL,
            allowNull: true
        },
        tax_percent: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        line_total: {
            type: DataTypes.DECIMAL,
            allowNull: true,
            defaultValue: 0.00
        }
    });
}
export default PurchaseInvoiceItems;
