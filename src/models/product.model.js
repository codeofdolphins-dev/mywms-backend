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
        gst_type: {
            type: DataTypes.ENUM("include", "exclude"),
            defaultValue: "exclude",
            allowNull: false
        },
        product_type: {
            type: DataTypes.ENUM("raw", "finished"),
            defaultValue: "raw",
            allowNull: false
        },
        package_type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        measure: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        selling_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        MRP: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        reorder_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isActive: {
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