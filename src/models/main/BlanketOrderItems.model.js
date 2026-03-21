import { DataTypes } from "sequelize";

function BlanketOrderItem(sequelize) {
    return sequelize.define('BlanketOrderItem', {
        bpo_id: {
            type: DataTypes.INTEGER
        },
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        total_contracted_qty: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false
        },
        remain_contracted_qty: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        }
    });
}

export default BlanketOrderItem;