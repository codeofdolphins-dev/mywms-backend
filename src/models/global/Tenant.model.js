import { DataTypes } from "sequelize";
import { db_obj } from "../../db/config.js";


const Tenant = db_obj.define("Tenant", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    companyName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    schemaName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM("active", "inactive"),
        defaultValue: "active"
    },
});


export default Tenant;