import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

const CompanyDetails = db_obj.define("CompanyDetails", {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    tenant_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    c_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ph_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profile_image: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

export default CompanyDetails;