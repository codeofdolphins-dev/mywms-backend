import { DataTypes } from "sequelize";

function Connection(sequelize) {
    return sequelize.define("Connection", {
        buyer_tenant: {        // buyer (Depriciate name)
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_tenant: {         // vendor (Depriciate name)
            type: DataTypes.STRING,
            allowNull: false
        },
        connection_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        connection_type: {
            type: DataTypes.ENUM("cfa / c&f agent", "3pl warehouse", "super stockist", "dealer", "distributor", "sub-distributor", "retail warehouse / backroom storage", "supplier", "pending"),
            allowNull: false
        }
    });
}

export default Connection;
