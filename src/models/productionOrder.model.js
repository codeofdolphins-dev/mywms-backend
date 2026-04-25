// import { db_obj } from "../db/config.js";
import { DataTypes } from "sequelize";

function ProductionOrder(sequelize) {
    return sequelize.define("ProductionOrder", {
        production_order_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        mfg_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false // The WIP/Production unit making the goods
        },
        target_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false // The final Finished Good (FG) product ID
        },
        planned_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        produced_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00 // Increments as FG Store accepts goods
        },
        status: {
            type: DataTypes.ENUM("draft", "planned", "in_progress", "completed", "cancelled"),
            defaultValue: "draft"
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
}
export default ProductionOrder;