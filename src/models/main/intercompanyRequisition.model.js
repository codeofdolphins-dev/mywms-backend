import { DataTypes } from "sequelize";

function IntercompanyRequisition(sequelize) {
    return sequelize.define('IntercompanyRequisition', {
        requisition_no: {
            type: DataTypes.STRING,
            unique: true
        },
        connection_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        buyer_node: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
            type: DataTypes.ENUM("pending", "assign_fg", "dispatched", "cancelled", "closed"),
            defaultValue: "pending"
        },
        priority: {
            type: DataTypes.ENUM("low", "normal", "high"),
            defaultValue: "normal"
        }
    });
}

export default IntercompanyRequisition;