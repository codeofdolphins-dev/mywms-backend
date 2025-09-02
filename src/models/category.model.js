// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function Category(sequelize) {
    return sequelize.define("Category", {
        name: {
            type: DataTypes.STRING,
            allowNull: true
        }
    })
}
export default Category;