import { DataTypes } from "sequelize";

function RequisitionSupplier(sequelize) {
    return sequelize.define("RequisitionSupplier", {
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        supplier_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("sent", "viewed", "quoted", "rejected"),
            defaultValue: "sent",
        },
    });
}

export default RequisitionSupplier;
