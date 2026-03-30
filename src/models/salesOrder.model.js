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

        
        // Internal Node ID of the company/location selling the goods
        seller_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // Central/Internal Node ID of the company/location buying the goods
        buyer_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "external"
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
        status: {
            type: DataTypes.ENUM("pending", "closed"),
            defaultValue: "pending"
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
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