import { DataTypes } from "sequelize";

function NodeDetails(sequelize) {
    return sequelize.define("NodeDetails", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {                      // this store address, state_id, district_id, lat, log
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {},
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        gst_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        license_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    })
}
export default NodeDetails;