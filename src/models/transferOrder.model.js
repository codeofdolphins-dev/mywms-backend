import { DataTypes } from "sequelize";

function TransferOrder(sequelize) {
    return sequelize.define("TransferOrder", {
        transfer_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },


        from_parent_node_id: {              // business node id
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        from_location_id: {                 // manufacturing unit / store id
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        from_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: false,
            defaultValue: "mfg_unit"
        },


        to_parent_node_id: {                // business node id
            type: DataTypes.INTEGER,
            allowNull: true
        },
        to_location_id: {                   // manufacturing unit / store id
            type: DataTypes.INTEGER,
            defaultValue: false
        },
        to_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
            defaultValue: "mfg_unit"
        },


        status: {
            type: DataTypes.ENUM("draft", "requested", "dispatched", "received", "cancelled"),
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    });

}
export default TransferOrder;