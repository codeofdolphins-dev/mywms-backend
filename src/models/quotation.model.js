import { DataTypes } from "sequelize";

function Quotation(sequelize) {
    return sequelize.define("Quotation", {
        requisition_id: {   // rename from pr_id
            type: DataTypes.INTEGER,
            allowNull: false
        },
        from_business_node_id: { // Location B (supplier role)
            type: DataTypes.INTEGER,
            allowNull: false
        },
        to_business_node_id: {   // Location A (requester)
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM(
                "submitted",
                "revised",
                "accepted",
                "rejected",
                "expired"
            ),
            defaultValue: "submitted"
        },
        valid_till: {
            type: DataTypes.DATE,
            allowNull: true
        },
        revision_no: {
            type: DataTypes.INTEGER,
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
