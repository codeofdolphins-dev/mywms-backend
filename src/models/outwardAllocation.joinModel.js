import { DataTypes } from "sequelize";

function OutwardAllocation(sequelize) {
    return sequelize.define("OutwardAllocation", {
        outward_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // References the OutwardItem table
        },
        batch_id: {
            type: DataTypes.INTEGER, 
            allowNull: false,
            // References the unified InventoryBatch table
        },
        allocated_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("allocated", "picked", "dispatched"),
            defaultValue: "allocated"
        }
    });
}

export default OutwardAllocation;