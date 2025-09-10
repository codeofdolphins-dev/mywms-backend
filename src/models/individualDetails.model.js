// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function IndividualDetails(sequelize) {
  return sequelize.define("IndividualDetails", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    district_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profile_image: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });
}


export default IndividualDetails;