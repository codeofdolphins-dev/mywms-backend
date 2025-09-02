import { DataTypes } from "sequelize";

function Tenant(sequelize) {
  return sequelize.define("Tenant", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: DataTypes.STRING,
    tenant: DataTypes.STRING,
  });
};
export default Tenant;