import { DataTypes } from "sequelize";

function VendorBankDetails(sequelize) {
    return sequelize.define("VendorBankDetails", {
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        account_holder_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bank_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        bank_branch: {
            type: DataTypes.STRING,
            allowNull: false
        },
        account_number: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
        },
        account_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ifsc_code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    });
}
export default VendorBankDetails;
