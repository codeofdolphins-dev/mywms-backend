import { DataTypes } from "sequelize";

function TenantsName(sequelize) {
  return sequelize.define("TenantsName", {
    tenant:{
        type: DataTypes.STRING,
        require: true,
        allowNull: false,
        unique: true
    },
  });
};
export default TenantsName;