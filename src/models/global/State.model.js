import { DataTypes } from "sequelize";
import { db_obj } from "../../db/config.js";

const State = db_obj.define("State",
  {
    name: {
      type: DataTypes.STRING,
    }
  },
  {
    timestamps: false,
  }
);

export default State;