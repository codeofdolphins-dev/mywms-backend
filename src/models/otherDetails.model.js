// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function OtherDetails(sequelize) {
  return sequelize.define("OtherDetails", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    
    meta: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    }
  });
}


export default OtherDetails;