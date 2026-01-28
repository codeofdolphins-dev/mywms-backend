import { DataTypes } from "sequelize";

function TenantBusinessFlowMaster(sequelize) {
    return sequelize.define("TenantBusinessFlowMaster", {
        tenant_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        node_type_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sequence: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    });
}
export default TenantBusinessFlowMaster;