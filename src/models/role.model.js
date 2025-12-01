// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function Role(sequelize) {
    return sequelize.define("Role", {
        role: {
            type: DataTypes.STRING,
            allowNull: true
        }
    })
}
export default Role;