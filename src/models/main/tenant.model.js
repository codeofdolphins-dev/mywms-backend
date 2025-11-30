import { DataTypes } from "sequelize";

function Tenant(sequelize) {
  return sequelize.define("Tenant", {
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isOwner: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  });
};
export default Tenant;