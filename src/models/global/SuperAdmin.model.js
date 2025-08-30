import { DataTypes } from "sequelize"
import { db_obj } from "../../db/config.js"


const SuperAdmin = db_obj.define("SuperAdmin", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        // autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },  // hashed
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

export default SuperAdmin;