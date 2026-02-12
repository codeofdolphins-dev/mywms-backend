import { DataTypes } from "sequelize";

function TenantBusinessFlow(sequelize) {
    return sequelize.define("TenantBusinessFlow", {
        node_type_code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_active : {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });
}
export default TenantBusinessFlow;