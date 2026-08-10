import { DataTypes } from "sequelize";

function Customer(sequelize) {
    return sequelize.define("Customer", {
        f_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        l_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        ph_no: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        gstin: {
            type: DataTypes.STRING,
            allowNull: true
        },
    });

}
export default Customer;