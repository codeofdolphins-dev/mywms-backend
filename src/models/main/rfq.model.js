import { DataTypes } from "sequelize";

function RFQ(sequelize) {
    return sequelize.define("RFQ", {
        rfq_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        pr_reference_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        priority: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("draft", "open", "closed", "cancelled"),
            defaultValue: "open",
        },
        submission_deadline: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        grand_total: {
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