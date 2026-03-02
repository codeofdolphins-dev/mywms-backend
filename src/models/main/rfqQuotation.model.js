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
        revision_no: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        status: {
            type: DataTypes.ENUM("draft", "sent", "confirmed", "closed", "cancelled"),
            defaultValue: "sent",
        },
        grand_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
    });
}

export default RfqQuotation;