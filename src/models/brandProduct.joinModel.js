import { DataTypes } from "sequelize";

function BrandProducts(sequelize) {
    return sequelize.define('BrandProducts', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'BrandProducts',
        timestamps: true
    });
}

export default BrandProducts;