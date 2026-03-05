import { DataTypes } from "sequelize";

function RfqQuotation(sequelize) {
    return sequelize.define("RfqQuotation", {
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        vendor_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        buyer_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        revision_no: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        status: {
            type: DataTypes.ENUM("draft", "sent", "negotiate", "confirmed", "closed", "cancelled"),
            defaultValue: "sent",
        },
        valid_till: {
            type: DataTypes.DATEONLY,
            allowNull: true,
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