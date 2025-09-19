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
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "user"
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  });
}
export default User;
