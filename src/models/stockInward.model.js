import { DataTypes } from "sequelize";
import { db_obj } from "../db/config.js";

const StockInward = db_obj.define("StockInward", {
    company_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    order_no: DataTypes.STRING,
    invoice_no: DataTypes.STRING,
    transport_pass_no: DataTypes.STRING,
    lr_no: DataTypes.STRING,
    vehicle_id: DataTypes.INTEGER,
    driver_id: DataTypes.INTEGER,
    status_type: DataTypes.STRING,
    indent_no: DataTypes.STRING,
});

export default StockInward;