import { DataTypes } from "sequelize";

function NodeUserOwner(sequelize) {
    return sequelize.define("NodeUserOwner", {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        is_node_owner: {
            type: DataTypes.BOOLEAN,
            defaultValues: false
        }
    });
}
export default NodeUserOwner;