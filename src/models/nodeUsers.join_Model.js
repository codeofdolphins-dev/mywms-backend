import { DataTypes } from "sequelize";

function NodeUser(sequelize) {
    return sequelize.define('NodeUser', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        department: {
            type: DataTypes.ENUM("purchase", "sales", "both"),
            defaultValue: null,
            allowNull: true
        },
        isNodeAdmin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
    });
}

export default NodeUser;