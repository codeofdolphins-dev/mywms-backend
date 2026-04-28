import { DataTypes } from "sequelize";
// import { db_obj } from "../db/config.js";

function Product(sequelize) {
    return sequelize.define('Product', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        hsn_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sku: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        barcode: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        product_type: {
            type: DataTypes.ENUM("raw", "finished"),
            defaultValue: "raw",
            allowNull: true
        },
        package_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        measure: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        unit_type: {
            type: DataTypes.STRING,
            allowNull: true,
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
        has_expiry: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        shelf_life: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });
}
export default Product;