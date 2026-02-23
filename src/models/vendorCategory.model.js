import { DataTypes } from "sequelize";

function VendorCategory(sequelize) {
    return sequelize.define("VendorCategory", {
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    });
}
export default VendorCategory;
