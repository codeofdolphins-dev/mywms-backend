import { DataTypes } from "sequelize";

function Qty(sequelize) {
    return sequelize.define("Qty", {
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        barcode: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    })
}
export default Qty;