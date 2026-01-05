import { DataTypes } from "sequelize";

function TenantBusinessFlow(sequelize) {
    return sequelize.define("TenantBusinessFlow", {
        node_type_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    });
}
export default TenantBusinessFlow;