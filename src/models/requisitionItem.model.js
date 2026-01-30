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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    approved_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  });
}
export default RequisitionItem;