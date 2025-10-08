import { DataTypes } from "sequelize";

function Inward(sequelize) {
  return sequelize.define("Inward", {
    po_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: true
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
      type: DataTypes.ENUM("pending", "verified", "partially received", "completed"),
      defaultValue: "pending"
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  });
}

export default Inward;
