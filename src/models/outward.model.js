import { DataTypes } from "sequelize";

function Outward(sequelize) {
    return sequelize.define("Outward", {
        outward_ref: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4
        },
        host_warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        target_warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        outward_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        outward_type: {
            type: DataTypes.ENUM("transfer", "sales", "other"),
            defaultValue: "transfer"
        },
        outward_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vehicle_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        driver_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("pending", "picked", "dispatched", "delivered", "cancelled"),
            defaultValue: "pending"
        },
        total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });
}
export default Outward;
