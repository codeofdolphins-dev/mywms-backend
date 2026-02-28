import { DataTypes } from "sequelize";

function Quotation(sequelize) {
    return sequelize.define("Quotation", {
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
            type: DataTypes.ENUM("draft", "open", "closed", "cancelled"),
            defaultValue: "sent",
        },
        total_amount: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
    });
}

export default Quotation;