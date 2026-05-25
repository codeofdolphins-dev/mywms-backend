import { DataTypes } from "sequelize";

function CostCenter(sequelize) {
    return sequelize.define("CostCenter", {
        cost_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        costHead_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        costSubHead_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM("monthly", "onetime", "yearly"),
            defaultValue: "monthly",
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(18, 2),
            defaultValue: 0.00,
            allowNull: false
        },
        creator_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        cost_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    })
}
export default CostCenter;