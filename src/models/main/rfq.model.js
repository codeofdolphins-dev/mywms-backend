import { DataTypes } from "sequelize";

function RFQ(sequelize) {
    return sequelize.define("RFQ", {
        rfq_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        buyer_tenant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        pr_reference_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("draft", "open", "closed", "cancelled"),
            defaultValue: "sent",
        },
        submission_deadline: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        grandTotal: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
    });
}

export default RFQ;