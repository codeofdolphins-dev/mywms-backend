import { DataTypes } from "sequelize";

function SupplierBrand(sequelize) {
    return sequelize.define('SupplierBrand', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        brand_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'SupplierBrands',
        timestamps: true
    });
}

export default SupplierBrand;