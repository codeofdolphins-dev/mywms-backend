import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

const Category = db_obj.define("Category", {
    name: {
        type: DataTypes.STRING,
        allowNull: true
    }
})

export default Category;