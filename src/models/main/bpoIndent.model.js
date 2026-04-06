import { DataTypes } from "sequelize";

function BpoIndent(sequelize) {
    return sequelize.define("BpoIndent", {
        indent_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        bpo_id: {
            type: DataTypes.INTEGER,
            allowNull: false // Links to BlanketOrders
        },
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // --- The Crucial Links ---
        buyer_po_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Populated after the local PO is created
        },
        supplier_so_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Populated after the local SO is created
        },
        status: {
            type: DataTypes.ENUM("draft", "confirmed", "fulfilled", "cancelled"),
            defaultValue: "confirmed"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        }
    });
}
export default BpoIndent;