import { DataTypes } from "sequelize";

function ManufacturingUnit(sequelize) {
    return sequelize.define("ManufacturingUnit", {
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.ENUM("rm store", "fg store", "production"),
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {                 // this store -> address, state, district, lat, log
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    });
}
export default ManufacturingUnit;