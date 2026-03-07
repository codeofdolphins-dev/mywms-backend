import { DataTypes } from "sequelize";

function RfqQuotationRevision (sequelize) {
    return sequelize.define("RfqQuotationRevision", {
        quotation_id: {
            type: DataTypes.INTEGER,
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
        grand_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
    });
}

export default RfqQuotationRevision;