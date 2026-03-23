import { DataTypes } from "sequelize";

function Vendor(sequelize) {
    return sequelize.define("Vendor", {
        name: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: {}
        },
        linked_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: true
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
