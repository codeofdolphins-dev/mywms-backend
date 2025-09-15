import { DataTypes } from "sequelize";

function TenantsName(sequelize) {
  return sequelize.define("TenantsName", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenant:{
        type: DataTypes.STRING,
        require: true,
        allowNull: false,
        unique: true
    },
  });
};
export default TenantsName;