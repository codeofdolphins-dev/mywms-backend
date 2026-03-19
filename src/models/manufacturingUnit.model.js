import { DataTypes } from "sequelize";

/** ManufacturingUnit === Store */
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
        store_type: {
            type: DataTypes.ENUM("rm_store", "fg_store", "production"),
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {                 // this store -> address, state, district, lat, log, pincode
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
    });
}
export default ManufacturingUnit;