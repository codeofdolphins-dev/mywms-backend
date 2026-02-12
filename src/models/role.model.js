// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function Role(sequelize) {
    return sequelize.define("Role", {
        role: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    })
}
export default Role;