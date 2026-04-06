import { DataTypes } from "sequelize";

function Batch(sequelize) {
    return sequelize.define("Batch", {
        // --- 1. CORE IDENTIFIERS ---
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        // --- 2. LOCATION TRACKING ---
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: false,
        },

        // --- 3. QUANTITIES ---
        available_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        reserved_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },

        // --- 4. AUDIT & REFERENCES ---
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM("grn", "production"),
            allowNull: true,
        },

        // --- 5. METADATA & STATUS ---
        batch_status: {
            type: DataTypes.ENUM("active", "quarantine", "expired", "consumed"),
            allowNull: true,
            defaultValue: "active",
        },
        unit_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        mfg_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        received_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    });
}

export default Batch;