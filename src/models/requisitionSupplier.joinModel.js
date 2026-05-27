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
        supplier_business_node_id: {       // Location B (supplier Internal)
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("sent", "viewed", "quoted", "accepted", "rejected", "assign_fg", "Waiting_for_dispatched"),
            defaultValue: "sent",
        },
    });
}

export default RequisitionSupplier;
