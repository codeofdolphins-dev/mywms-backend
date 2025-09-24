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
        quotation_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("Submitted", "Selected", "Rejected"),
            defaultValue: "Submitted"
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });
}
export default VendorQuotation;
