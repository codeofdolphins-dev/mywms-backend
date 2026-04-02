import { DataTypes } from "sequelize";

function OutwardItem(sequelize) {
    return sequelize.define("OutwardItem", {
        outward_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        sales_order_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        batch_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        requested_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        dispatch_qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        mfg_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        }
    });
}
export default OutwardItem;
