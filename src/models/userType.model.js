import { DataTypes } from "sequelize";

function UserType(sequelize) {
    return sequelize.define("UserType", {
        type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        level_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        hierarchy_level: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    });
}
export default UserType;
// export default RequisitionHierarchyMaster;