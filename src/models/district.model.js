import { DataTypes } from "sequelize";
import State from "./state.model.js";
import { db_obj } from "../db/config.js";


const District = db_obj.define("District",
  {
    name: {
      type: DataTypes.STRING,
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: State,
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);

export default District;