import { DataTypes } from "sequelize";

function Connection(sequelize) {
    return sequelize.define("Connection", {
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        connection_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        connection_type: {
            type: DataTypes.ENUM("cfa / c&f agent", "3pl warehouse", "super stockist", "dealer", "distributor", "sub-distributor", "retail warehouse / backroom storage", "supplier"),
            allowNull: false
        }
    });
}

export default Connection;
