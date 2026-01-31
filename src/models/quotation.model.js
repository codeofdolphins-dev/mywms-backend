import { DataTypes } from "sequelize";

function Quotation(sequelize) {
    return sequelize.define("Quotation", {
        pr_id: {        // pr(Purchase Request) == requisition
            type: DataTypes.INTEGER,
            allowNull: false
        },
        supplier_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("submitted", "selected", "rejected"),
            defaultValue: "submitted"
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });
}
export default Quotation;
