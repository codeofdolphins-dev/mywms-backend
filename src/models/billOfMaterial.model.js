import { DataTypes } from "sequelize";

function BillOfMaterial(sequelize) {
    return sequelize.define("BillOfMaterial", {
        finished_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        raw_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        quantity_required: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        uom: {
            type: DataTypes.STRING,
            allowNull: true
        },
    })
}
export default BillOfMaterial;