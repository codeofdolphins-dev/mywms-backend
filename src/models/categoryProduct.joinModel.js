import { DataTypes } from "sequelize";

function CategoryProducts(sequelize) {
    return sequelize.define('CategoryProducts', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'CategoryProducts',
        timestamps: true
    });
}

export default CategoryProducts;