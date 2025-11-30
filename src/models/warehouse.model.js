// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function Warehouse(sequelize) {
    return sequelize.define("Warehouse", {
        user_id : {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        warehouse_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        gst_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        license_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lat: {
            type: DataTypes.DECIMAL,
            defaultValue: 0.00
        },
        long: {
            type: DataTypes.DECIMAL,
            defaultValue: 0.00
        }
    })
}
export default Warehouse;