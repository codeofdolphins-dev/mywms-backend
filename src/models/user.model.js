// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function User(sequelize) {
  return sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM("warehouse", "distributor", "employee", "supplier", "other", "admin"),
      allowNull: false,
      defaultValue: "other"
    },
    owner_type: {
      type: DataTypes.ENUM("warehouse", "distributor", "other"),
      allowNull: true
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  });
}
export default User;
