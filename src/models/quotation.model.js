import { DataTypes } from "sequelize";

function Quotation(sequelize) {
    return sequelize.define("Quotation", {
        pr_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("submitted", "selected", "rejected"),
            defaultValue: "submitted"
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
export default Quotation;
