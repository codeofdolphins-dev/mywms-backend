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
        // user_type_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: false,
        // },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        full_name: {
            type: DataTypes.STRING,
            allowNull: true
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
        owner_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        owner_type: {
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
