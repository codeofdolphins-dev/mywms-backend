import { DataTypes } from "sequelize";
// import { db_obj } from "../db/config.js"

function Driver(sequelize) {
    return sequelize.define('Driver', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        license_no: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contact_no: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
}
export default Driver;