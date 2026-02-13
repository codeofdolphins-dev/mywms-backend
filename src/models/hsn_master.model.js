import { DataTypes } from "sequelize";

function HSN(sequelize) {
    return sequelize.define("HSN", {
        hsn_code: {
            type: DataTypes.STRING(8),   // 4/6/8 digit allowed
            allowNull: false,
            unique: true
        },
        default_gst_rate: {
            type: DataTypes.DECIMAL(5, 2),  // total GST (e.g., 18.00)
            allowNull: false,
            defaultValue: 0.00
        },
        cess_rate: {        // Tobacco, Luxury goods, Some special categories
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        is_exempt: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        effective_from: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        effective_to: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
    });

}
export default HSN;

/**
 * if (intraState) {
 *  cgst = gst_rate / 2
 *  sgst = gst_rate / 2
 * } else {
 *  igst = gst_rate
 * }
 */