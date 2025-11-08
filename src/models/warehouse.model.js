// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function Warehouse(sequelize) {
    return sequelize.define("Warehouse", {
        user_id : {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        owner_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        owner_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        f_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        l_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        ph_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        profile_image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        state_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        district_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        pincode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        gst_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        license_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lat: {
            type: DataTypes.DECIMAL,
            defaultValue: 0.00
        },
        long: {
            type: DataTypes.DECIMAL,
            defaultValue: 0.00
        }
    })
}
export default Warehouse;