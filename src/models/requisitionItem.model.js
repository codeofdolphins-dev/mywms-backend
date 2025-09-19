import { DataTypes } from "sequelize";

function RequisitionItem(sequelize) {
  return sequelize.define("RequisitionItem", {
    requisition_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    barcode_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    uom: {
      type: DataTypes.STRING,   // Unit of measure (pcs, kg, box, etc.)
      allowNull: false,
    },
    unit_price_estimate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
  });
}
export default RequisitionItem;