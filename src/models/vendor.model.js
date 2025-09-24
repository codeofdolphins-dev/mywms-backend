import { DataTypes } from "sequelize";

function Vendor(sequelize) {
    return sequelize.define("Vendor", {
        name: {
            type: DataTypes.INTEGER,
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
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        address: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        gst_number: {
            type: DataTypes.DECIMAL,
            allowNull: false
        },
        line_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    });
}
export default Vendor;
