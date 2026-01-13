import { DataTypes } from "sequelize";

function UnitType(sequelize) {
  return sequelize.define("UnitType", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
  });
}
export default UnitType;