import { DataTypes } from "sequelize";

function RequisitionHierarchyMaster(sequelize) {
    return sequelize.define("RequisitionHierarchyMaster", {
        module_name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });
}
export default RequisitionHierarchyMaster;