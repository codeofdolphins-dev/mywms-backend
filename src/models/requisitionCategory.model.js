import { DataTypes } from "sequelize";

function RequisitionCategory(sequelize) {
    return sequelize.define("RequisitionCategory", {
        name: {
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
export default RequisitionCategory;