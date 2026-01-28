import { DataTypes } from "sequelize";

function Supplier(sequelize) {
    return sequelize.define("Supplier", {
        name: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
        },
        supplier_type: {
            type: DataTypes.ENUM("RAW", "FINISHED"),
            allowNull: false,
            defaultValue: "FINISHED"
        },
        business_mode: {
            type: DataTypes.ENUM("MANUFACTURING", "TRADING"),
            allowNull: false,
            defaultValue: "TRADING"
        },
        contact_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        contact_email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        status: {
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
export default Supplier;
