import { DataTypes } from "sequelize";

function ProductionOrderItem(sequelize) {
    return sequelize.define("ProductionOrderItem", {
        production_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false // Links to the parent Production Order
        },
        rm_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false // The specific Raw Material required
        },
        required_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00 // How much RM is needed total
        }
    });
}
export default ProductionOrderItem;