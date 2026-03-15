import { DataTypes } from "sequelize";

function BlanketOrderItem(sequelize) {
    return sequelize.define('BlanketOrderItem', {
        bpo_id: {
            type: DataTypes.INTEGER
        },
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }, // Only Buyer ID
        total_contracted_qty: {
            type: DataTypes.INTEGER
        },
        remain_contracted_qty: {
            type: DataTypes.INTEGER
        },
        unit_price: {
            type: DataTypes.DECIMAL(12, 2)
        }
    });
}

export default BlanketOrderItem;