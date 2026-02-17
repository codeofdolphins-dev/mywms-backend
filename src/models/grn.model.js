import { DataTypes } from "sequelize";

function GRN(sequelize) {
    return sequelize.define("GRN", {
        grn_no: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        purchase_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        from_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        to_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        received_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM("draft", "accepted", "cancelled"),
            defaultValue: "draft"
        },
        created_by: {
            type: DataTypes.INTEGER
        }
    });

}
export default GRN;