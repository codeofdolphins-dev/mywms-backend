import { DataTypes } from "sequelize";

function Brand(sequelize) {
    return sequelize.define("Brand", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true
        },
        origin_country: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    })
}
export default Brand;