import { DataTypes } from "sequelize";

function RetailSaleAllocation(sequelize) {
    return sequelize.define("RetailSaleAllocation", {
        sale_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        }
    });

}
export default RetailSaleAllocation;