import { DataTypes } from "sequelize";

function VendorQuotation(sequelize) {
    return sequelize.define("VendorQuotation", {
        pr_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("Submitted", "Selected", "Rejected"),
            defaultValue: "Submitted"
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00
        }
    });
}
export default VendorQuotation;
