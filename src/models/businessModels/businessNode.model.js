import { DataTypes } from "sequelize";

function BusinessNode(sequelize) {
    return sequelize.define("BusinessNode", {
        node_type_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tenant_business_flow_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        parent_node_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    });
}
export default BusinessNode;
