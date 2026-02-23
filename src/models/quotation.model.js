import { DataTypes } from "sequelize";

function Quotation(sequelize) {
    return sequelize.define("Quotation", {
        quotation_no: {
            type: DataTypes.STRING,
            unique: true
        },
        requisition_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "external"
        },
        from_supplier_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        to_business_node_id: {   // Location A (requester)
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(
                "draft",
                "submitted",
                "accepted",
                "rejected",
                "expired"
            ),
            defaultValue: "draft"
        },
        valid_till: {
            type: DataTypes.DATE,
            allowNull: true
        },
        revision_no: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        grandTotal: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        note: {
            type: DataTypes.TEXT
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

}
export default Quotation;
