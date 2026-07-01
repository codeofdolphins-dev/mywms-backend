import { DataTypes } from "sequelize";

function Connection(sequelize) {
    return sequelize.define("Connection", {
        parent_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        child_tenant: {
            type: DataTypes.STRING,
            allowNull: false
        },
        connection_status: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        connection_type: {
            type: DataTypes.ENUM("cfa / c&f agent", "3pl warehouse", "super stockist", "dealer", "distributor", "sub-distributor", "retail warehouse / backroom storage", "supplier", "pending"),
            allowNull: false
        }
    });
}

export default Connection;
