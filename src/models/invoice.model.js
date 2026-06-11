import { DataTypes } from "sequelize";

function Invoice(sequelize) {
    return sequelize.define("Invoice", {
        parent_location_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        
        invoice_no: {
            type: DataTypes.STRING,
            unique: true,
        },
        invoice_date: {
            type: DataTypes.DATE,
        },
        sub_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        total_tax_amount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        discount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
    });
}
export default Invoice;
