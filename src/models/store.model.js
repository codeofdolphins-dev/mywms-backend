import { DataTypes } from "sequelize";

function Store(sequelize) {
    return sequelize.define("Store", {
        store_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        node_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    })
}

export default Store;