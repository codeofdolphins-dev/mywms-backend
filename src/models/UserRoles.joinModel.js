import { DataTypes } from "sequelize";
import { db_obj } from "../db/config.js";


const UserRoles = db_obj.define('UserRoles', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Roles',
            key: 'id'
        }
    }
}, {
    tableName: 'UserRoles',
    timestamps: true
});


export default UserRoles;