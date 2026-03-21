import { DataTypes } from "sequelize";

function PurchasOrder(sequelize) {
    return sequelize.define("PurchasOrder", {
        po_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // --- NEW BPO LINKAGE FIELDS ---
        bpo_id: {
            type: DataTypes.INTEGER,
            allowNull: true // Only filled if generated from BPO
        },
        target_store_id: {
            type: DataTypes.INTEGER,
            allowNull: true // maps to your L-Code (e.g., L-103) [cite: 18]
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
            unique: false    // Remove unique if multiple Indents use same quote terms
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
            type: DataTypes.ENUM("internal", "bpo_release"),
            allowNull: false,
            defaultValue: "internal"
        },
        to_supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("released", "approve", "closed", "cancelled"),
            defaultValue: "released"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        grand_total: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    });
}
export default PurchasOrder;