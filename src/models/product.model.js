import { DataTypes } from "sequelize";
// import { db_obj } from "../db/config.js";

function Product(sequelize) {
    return sequelize.define('Product', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        hsn_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sku: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        barcode: {
            type: DataTypes.BIGINT,
            allowNull: false,
            unique: true,
        },
        product_type: {
            type: DataTypes.ENUM("raw", "finished"),
            defaultValue: "raw",
            allowNull: false
        },
        package_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        measure: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        unit_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        reorder_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });
}
export default Product;