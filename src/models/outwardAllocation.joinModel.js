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

        shortage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        damage_qty: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },

        status: {
            type: DataTypes.ENUM("allocated", "picked", "dispatched"),
            defaultValue: "allocated"
        }
    });
}

export default OutwardAllocation;