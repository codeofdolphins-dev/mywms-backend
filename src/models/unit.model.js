// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function Unit(sequelize) {
  return sequelize.define("Unit", {
    unit: {
      type: DataTypes.STRING,
      allowNull: false
    },
  });
}
export default Unit;