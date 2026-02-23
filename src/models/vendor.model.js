import { DataTypes } from "sequelize";

function Vendor(sequelize) {
    return sequelize.define("Vendor", {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        access_token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        name: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
        },
        vendor_category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        gst_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        }
    });
}
export default Vendor;
