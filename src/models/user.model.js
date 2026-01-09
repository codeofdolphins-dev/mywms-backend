import { DataTypes } from "sequelize";

function User(sequelize) {
    return sequelize.define("User", {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        phone_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        profile_image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        accessToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        }
    });
}
export default User;
