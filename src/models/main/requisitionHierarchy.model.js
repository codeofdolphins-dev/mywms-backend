import { DataTypes } from "sequelize";

function RequisitionHierarchy(sequelize) {
    return sequelize.define("RequisitionHierarchy", {
        company_id: {   // NOTE: not define yet
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        module_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sequence_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
        }
    });
}
export default RequisitionHierarchy;