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
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        total_contracted_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        unsettled_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0
        },
        remain_contracted_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: false
        }
    });
}

export default BlanketOrderItem;