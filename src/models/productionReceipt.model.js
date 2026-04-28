import { DataTypes } from "sequelize";

function ProductionReceipt(sequelize) {
    return sequelize.define("ProductionReceipt", {
        receipt_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        production_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false // Link back to the instruction
        },
        fg_store_id: {
            type: DataTypes.INTEGER,
            allowNull: false // The destination location (FG Store)
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false // The Finished Good being handed over
        },
        send_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        received_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        dmg_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        short_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        mfg_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("pending", "accepted", "rejected"),
            defaultValue: "pending"
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
}
export default ProductionReceipt;