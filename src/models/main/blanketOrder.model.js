import { DataTypes } from "sequelize";

function BlanketOrder(sequelize) {
    return sequelize.define('BlanketOrder', {
        bpo_no: {
            type: DataTypes.STRING,
            unique: true
        },
        pr_reference_code: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        connection_id: {         // carries both parties — Connection.buyer_tenant / vendor_tenant
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rfq_quotation_revision_id: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.ENUM('draft', 'active', 'closed'),
            defaultValue: 'draft'
        },
        valid_until: {
            type: DataTypes.DATEONLY
        }
    });
}

export default BlanketOrder;