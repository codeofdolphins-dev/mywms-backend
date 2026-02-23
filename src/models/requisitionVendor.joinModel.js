import { DataTypes } from "sequelize";

function RequisitionVendor(sequelize) {
    return sequelize.define("RequisitionVendor", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        vendor_id: {
            type: DataTypes.INTEGER,       // Location B (vendor External)
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("sent", "viewed", "quoted", "accepted", "rejected"),
            defaultValue: "sent",
        },
    });
}

export default RequisitionVendor;
