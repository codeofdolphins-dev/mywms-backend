import { DataTypes } from "sequelize";

function BOMItem(sequelize) {
    return sequelize.define("BOMItem", {
        bom_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        raw_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        required_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        uom: {
            type: DataTypes.STRING,
            allowNull: true
        },
    })
}
export default BOMItem;