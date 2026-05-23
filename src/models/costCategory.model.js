import { DataTypes } from "sequelize";

function CostCategory(sequelize) {
    return sequelize.define("CostCategory", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
    })
}
export default CostCategory;