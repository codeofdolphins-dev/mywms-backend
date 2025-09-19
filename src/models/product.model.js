import { DataTypes } from "sequelize";
// import { db_obj } from "../db/config.js";

function Product(sequelize) {
    return sequelize.define('Product', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sku: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        gst_type: {
            type: DataTypes.ENUM("include", "exclude"),
            defaultValue: "exclude",
        },
        hsn_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        barcode: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
        },
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        unit_of_measure: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cost_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        selling_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        reorder_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        status: {
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