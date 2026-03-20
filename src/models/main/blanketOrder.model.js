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
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_tenant: {
            type: DataTypes.STRING,
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