import { DataTypes } from "sequelize";

function Vendor(sequelize) {
    return sequelize.define("Vendor", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        primary_phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        secondary_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        gst_number: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });
}
export default Vendor;
