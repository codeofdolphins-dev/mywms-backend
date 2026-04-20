import { DataTypes } from "sequelize";

function BOM(sequelize) {
    return sequelize.define("BOM", {
        finished_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        finished_product_barcode: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        output_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        output_uom: {
            type: DataTypes.STRING,
            allowNull: false
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
    })
}
export default BOM;