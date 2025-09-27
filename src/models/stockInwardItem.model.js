import { DataTypes } from "sequelize";

function StockInwardItem(sequelize) {
    return sequelize.define('StockInwardItem', {
        stock_inward_id: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        product_id: { 
            type: DataTypes.INTEGER,
            allowNull: false
        },
        batch_no: {
            type: DataTypes.STRING,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        damage_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        shortage_qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        unit_cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        total_cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    });
}

export default StockInwardItem;