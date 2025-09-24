import { DataTypes } from "sequelize";

function RequestOrder(sequelize) {
    return sequelize.define("RequestOrder", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        prId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        poId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    }, {
        tableName: 'RequestOrder',
        timestamps: true
    });
}
export default RequestOrder;
