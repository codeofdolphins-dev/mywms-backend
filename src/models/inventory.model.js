import { DataTypes } from "sequelize";

function Inventory(sequelize) {
    return sequelize.define("Inventory", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        available_qty: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        last_inward_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        last_outward_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['product_id', 'warehouse_id'] // 1 product in 1 warehouse = 1 inventory record
            }
        ]
    });
}

export default Inventory;
