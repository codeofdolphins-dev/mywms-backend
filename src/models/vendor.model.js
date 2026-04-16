import { DataTypes } from "sequelize";

function Vendor(sequelize) {
    return sequelize.define("Vendor", {
        name: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
        },
        tenant: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        linked_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "BusinessNode.id from the vendor's own tenant DB — cross-tenant reference, not a local FK"
        },
        type: {
            type: DataTypes.ENUM("vendor", "buyer"),
            allowNull: false,
            defaultValue: "vendor",
            comment: "vendor when PO is created for this vendor or buyer when SO is created for this buyer"
        },
        contact_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        contact_email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        address: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        meta: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {}
        }
    });
}
export default Vendor;
