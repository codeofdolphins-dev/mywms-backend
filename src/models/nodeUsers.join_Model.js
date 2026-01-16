import { DataTypes } from "sequelize";

function NodeUser(sequelize) {
    return sequelize.define('NodeUser', {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        userRole: {
            type: DataTypes.ENUM("NODE_ADMIN", "NODE_USER"),
            allowNull: false,
            defaultValue: "NODE_USER"
        },
    });
}

export default NodeUser;