import { DataTypes } from "sequelize";
import { db_obj } from "../db/config.js";


const Product = db_obj.define('Product', {
    item_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    hsn_code: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    barcode: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    sub_category: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    manufacture: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    item_mrp: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },

    aed: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },

    pack_size: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    liquor_kind: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    measure: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    category: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    brand: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    landing_cost: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },

    status: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    brand_owner: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    distributor: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    photo: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
});

export default Product;