import { DataTypes } from "sequelize";

function SalesOrder(sequelize) {
    return sequelize.define("SalesOrder", {
        so_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        source_po_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        from_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        to_supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "external"
        },
        status: {
            type: DataTypes.ENUM("released", "approve", "closed", "cancelled"),
            defaultValue: "released"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        grand_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    });
}
export default SalesOrder;
