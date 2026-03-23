import { DataTypes } from "sequelize";

function SalesOrder(sequelize) {
    return sequelize.define("SalesOrder", {
        so_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        // Changed to String to capture the Buyer's actual PO Number, not their local DB ID
        source_po_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Link back to the master contract in the Central DB
        central_bpo_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            defaultValue: "medium"
        },
        // The Central Node ID of the company buying the goods
        buyer_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // Captures the destination RM Store selected by the buyer
        delivery_address: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        required_by: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "external"
        },
        status: {
            type: DataTypes.ENUM("pending", "closed"),
            defaultValue: "pending"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        grand_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    });
}
export default SalesOrder;