import { DataTypes } from "sequelize";
// import { db_obj } from "../db/config.js";

function RolePermissions(sequelize) {
    return sequelize.define('RolePermissions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'RolePermissions',
        timestamps: true
    });
}

export default RolePermissions;