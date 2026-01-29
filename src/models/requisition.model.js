import { DataTypes } from "sequelize";

function Requisition(sequelize) {
  return sequelize.define("Requisition", {
    requisition_no: {
      type: DataTypes.STRING,
      allowNull: false
    },
    buyer_business_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    supplier_business_node_id: {
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
    total: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
      defaultValue: 0.00
    },
    required_by_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: 0.00
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("draft", "submitted", "pending", "approved", "rejected", "cancelled"),
      defaultValue: "draft"
    },
    priority: {
        type: DataTypes.ENUM("low", "normal", "high"),
        defaultValue: "normal"
    },
  });
}
export default Requisition;
