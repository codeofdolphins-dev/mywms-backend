import { DataTypes } from "sequelize";
import { db_obj } from "../db/config.js";


const RolePermissions = db_obj.define('RolePermissions', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Roles',
            key: 'id'
        }
    },
    permissionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Permission',
            key: 'id'
        }
    }
}, {
    tableName: 'RolePermissions',
    timestamps: true
});


export default RolePermissions;