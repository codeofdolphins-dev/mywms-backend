import { DataTypes } from "sequelize";

function RequisitionItem(sequelize) {
  return sequelize.define("RequisitionItem", {
    requisition_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    approved_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    unit_price_estimate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
  });
}
export default RequisitionItem;