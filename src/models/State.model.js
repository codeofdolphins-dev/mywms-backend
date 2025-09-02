import { DataTypes } from "sequelize";
// import { db_obj } from "../db/config.js";

function State(sequelize) {
  return sequelize.define("State",
    {
      name: {
        type: DataTypes.STRING,
      }
    },
    {
      timestamps: false,
    }
  );
}
export default State;