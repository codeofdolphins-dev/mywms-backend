import { DataTypes } from "sequelize";

function Permission(sequelize) {
    return sequelize.define("Permission", {
        permission: {
            type: DataTypes.STRING,
            allowNull: false
        }
    })
}

export default Permission;