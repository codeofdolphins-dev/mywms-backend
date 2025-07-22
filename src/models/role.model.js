import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

const Role = db_obj.define("Role", {
    role: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

export default Role;