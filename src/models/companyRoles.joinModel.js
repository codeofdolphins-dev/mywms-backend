import { DataTypes } from "sequelize";
import { db_obj } from "../db/config.js";


const CompanyRoles = db_obj.define('CompanyRoles', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Company',
            key: 'id'
        }
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Role',
            key: 'id'
        }
    }
}, {
    tableName: 'CompanyRoles',
    timestamps: true
});


export default CompanyRoles;