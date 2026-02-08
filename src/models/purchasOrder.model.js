import { DataTypes } from "sequelize";

function PurchasOrder(sequelize) {
    return sequelize.define("PurchasOrder", {
        po_no: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        form_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        to_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("created", "released", "acknowledge", "in_fulfillment", "in_transit", "delevered", "closed", "cancelled"),
            defaultValue: "created"
        },
        po_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
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
