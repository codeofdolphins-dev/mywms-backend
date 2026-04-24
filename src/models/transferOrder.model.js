import { DataTypes } from "sequelize";

function TransferOrder(sequelize) {
    return sequelize.define("TransferOrder", {
        transfer_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        type: {
            type: DataTypes.ENUM("material_issue", "production_transfer"),
            allowNull: true,
        },

        /******************* Transfer Order Request Creater *******************/
        from_parent_node_id: {              // business node id (OPTIONAL)
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
        
        
        /******************* Transfer Order Request Fulfiller *******************/
        to_parent_node_id: {                // business node id (OPTIONAL)
            type: DataTypes.INTEGER,
            allowNull: true
        },
        to_location_id: {                   // manufacturing unit / store id
            type: DataTypes.INTEGER,
            allowNull: false
        },
        to_location_type: {
            type: DataTypes.ENUM("mfg_unit", "business_node"),
            allowNull: true,
            defaultValue: "mfg_unit"
        },


        required_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
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