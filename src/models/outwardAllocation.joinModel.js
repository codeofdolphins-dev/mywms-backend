import { DataTypes } from "sequelize";

function OutwardAllocation(sequelize) {
    return sequelize.define("OutwardAllocation", {
        outward_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        allocated_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("allocated", "picked", "dispatched"),
            defaultValue: "allocated"
        }
    });
}

export default OutwardAllocation;