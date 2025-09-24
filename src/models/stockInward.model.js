import { DataTypes } from "sequelize";

function StockInward(sequelize) {
  return sequelize.define("StockInward", {
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    inward_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    challan_no: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transport_pass_no: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("Pending", "Verified", "Partially Received", "Completed"),
      defaultValue: "Pending"
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });
}

export default StockInward;
