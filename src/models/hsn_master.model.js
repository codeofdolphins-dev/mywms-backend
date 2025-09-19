import { DataTypes } from "sequelize";

function HSN(sequelize) {
    return sequelize.define("HSN", {
        hsn_code: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        rate: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.00
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    })
}
export default HSN;