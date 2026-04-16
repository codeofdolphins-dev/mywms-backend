import { DataTypes } from "sequelize";

function PurchasOrder(sequelize) {
    return sequelize.define("PurchasOrder", {
        po_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },

        // --- NEW BPO LINKAGE FIELDS ---
        central_bpo_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Only filled if generated from BPO
        },
        central_indent_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Only filled if generated from indent
        },

        target_store_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            defaultValue: "medium"
        },
        required_by: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        // --- MODIFIED EXISTING FIELDS ---
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // MUST BE NULLABLE for BPO Indents
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: true  // BPO Indents don't always have a direct PR 
        },
        // --- REMAINING FIELDS ---
        from_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("internal", "external", "bpo_release"),
            allowNull: false,
            defaultValue: "internal"
        },
        to_supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("draft", "sent_to_supplier", "waiting_for_poi", "poi_received", "approved", "picking_in_progress", "closed", "cancelled"),
            defaultValue: "draft"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    });
}
export default PurchasOrder;