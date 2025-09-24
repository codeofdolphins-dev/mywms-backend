import { DataTypes } from "sequelize";

function Requisition(sequelize) {
  return sequelize.define("Requisition", {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("Draft", "Submitted", "Pending", "Approved", "Rejected", "Cancelled"),
      defaultValue: "Draft"
    },
    priority: {
        type: DataTypes.ENUM("Low", "Normal", "High"),
        defaultValue: "Normal"
    },
    required_by: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
      defaultValue: 0.00
    },
  });
}
export default Requisition;
