import { DataTypes } from "sequelize";

function Warehouse(sequelize) {
    return sequelize.define("Warehouse", {
        name : {
            type: DataTypes.STRING,
            allowNull: false
        },
        location : {
            type: DataTypes.STRING,
            allowNull: false
        },
        type : {
            type: DataTypes.STRING,
            allowNull: false
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
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    })
}
export default Warehouse;