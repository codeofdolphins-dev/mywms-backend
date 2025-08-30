import { db_obj } from "../../db/config.js";
import { DataTypes } from "sequelize";

const Vehicle = db_obj.define("Vehicle", {
    number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    rc_no: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    chassis_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    engine_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

export default Vehicle;