import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

const Warehouse = db_obj.define("Warehouse", {
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
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lat: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    long: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    cat_id: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    accessToken: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

export default Warehouse;