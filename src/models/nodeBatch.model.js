import { DataTypes } from "sequelize";

function NodeBatch(sequelize) {
    return sequelize.define("NodeBatch", {
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: false,
        },

        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reference_type: {
            type: DataTypes.ENUM("grn", "production"),
            allowNull: true,
        },

        batch_status: {
            type: DataTypes.ENUM("active", "quarantine", "expired", "consumed"),
            allowNull: true,
        },
        purchase_price: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        received_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
    });
}
export default NodeBatch;