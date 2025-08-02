import { DataTypes } from "sequelize";
import { db_obj } from "../db/config.js";


const StockInwardItem = db_obj.define('StockInwardItem', {
    stock_inward_id: DataTypes.INTEGER,
    barcode: DataTypes.STRING,
    brand: DataTypes.STRING,
    batch_no: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    damage_qty: DataTypes.INTEGER,
    shortage_qty: DataTypes.INTEGER,
    expiry_date: DataTypes.DATE,
});

export default StockInwardItem;
