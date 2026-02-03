import { DataTypes } from "sequelize";

function Requisition(sequelize) {
    return sequelize.define("Requisition", {
        requisition_no: {
            type: DataTypes.STRING,
            unique: true
        },
        buyer_business_node_id: {        // Location A (requester)
            type: DataTypes.INTEGER,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        required_by_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("pending", "quoted", "cancelled", "closed"),
            defaultValue: "pending"
        },
        priority: {
            type: DataTypes.ENUM("low", "normal", "high"),
            defaultValue: "normal"
        },
    });
}
export default Requisition;
