import { DataTypes } from "sequelize";

function DirectTransfer(sequelize) {
    return sequelize.define("DirectTransfer", {
        dir_trans_no: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        },
        from_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        from_mfg_unit_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        target_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        transfer_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("draft", "send", "accepted", "return", "cancelled"),
            defaultValue: "send"
        },
        created_by: {
            type: DataTypes.INTEGER
        }
    });

}
export default DirectTransfer;