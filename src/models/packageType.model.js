import { DataTypes } from "sequelize";

function PackageType(sequelize) {
  return sequelize.define("PackageType", {
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
export default PackageType;