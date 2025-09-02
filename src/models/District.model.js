import { DataTypes } from "sequelize";
// import { db_obj } from "../db/config.js";

function District(sequelize) {
  return sequelize.define("District",
    {
      name: {
        type: DataTypes.STRING,
      },
      state_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );
}

export default District;