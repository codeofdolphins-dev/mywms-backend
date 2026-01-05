import { DataTypes } from "sequelize";

function BusinessNodeType(sequelize) {
    return sequelize.define("BusinessNodeType", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });
}
export default BusinessNodeType;