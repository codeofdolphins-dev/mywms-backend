import { DataTypes } from "sequelize";

function RequisitionRule(sequelize) {
    return sequelize.define("RequisitionRule", {
        company_id: {
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
export default RequisitionRule;