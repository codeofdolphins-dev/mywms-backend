import { DataTypes } from "sequelize";

function Tenant(sequelize) {
  return sequelize.define("Tenant", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING
    },
    companyName: {
      type: DataTypes.STRING
    },
    isOwner: {
      type: DataTypes.BOOLEAN,
      default: false
    },
    tenant_id: DataTypes.UUID,
  });
};
export default Tenant;