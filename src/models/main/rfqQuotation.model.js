import { DataTypes } from "sequelize";

function RfqQuotation(sequelize) {
    return sequelize.define("RfqQuotation", {
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        vendor_tenant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        buyer_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        current_revision_no: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        valid_till: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
    });
}

export default RfqQuotation;