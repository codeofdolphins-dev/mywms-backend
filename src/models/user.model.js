import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

const User = db_obj.define("User", {
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
  }
});

export default User;
