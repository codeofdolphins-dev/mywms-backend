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
        status: {
            type: DataTypes.ENUM("accept", "reject"),
            allowNull: true,
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