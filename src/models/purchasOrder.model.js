import { DataTypes } from "sequelize";

function PurchasOrder(sequelize) {
    return sequelize.define("PurchasOrder", {
        po_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        from_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "external"
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
            allowNull: true,
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    });
}
export default PurchasOrder;
