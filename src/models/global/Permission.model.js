import { db_obj } from "../../db/config.js";
import { DataTypes } from "sequelize";

const Permission = db_obj.define("Permission", {
    permission: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

export default Permission;