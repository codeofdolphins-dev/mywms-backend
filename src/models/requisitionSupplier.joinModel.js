import { DataTypes } from "sequelize";

function RequisitionSupplier(sequelize) {
    return sequelize.define("RequisitionSupplier", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        supplier_business_node_id: {       // Location B (supplier role)
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("sent", "viewed", "quoted", "accepted", "rejected"),
            defaultValue: "sent",
        },
    });
}

export default RequisitionSupplier;
