import { DataTypes } from "sequelize";

function GRN(sequelize) {
    return sequelize.define("GRN", {
        grn_no: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        },
        purchase_order: {
            type: DataTypes.STRING,
            allowNull: true
        },
        grn_type: {
            type: DataTypes.ENUM("purchase", "transfer", "return"),
            allowNull: false
        },
        sender_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        receiver_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        mfg_unit_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        received_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        // stamped when a transit GRN is accepted at the gate (transit -> report)
        report_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("draft", "accepted", "cancelled", "return", "transit", "report"),
            defaultValue: "draft"
        },
        total_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        reference: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        created_by: {
            type: DataTypes.INTEGER
        }
    });

}
export default GRN;

// NOTE: 
/**
 * if type == purchase => SALER (sender_id), BUYER (receiver_id + mfg_unit_id)
 * if type == transfer => SENDER (sender_id + || mfg_unit_id), RECEIVER (receiver_id)
 */