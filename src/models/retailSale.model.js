import { DataTypes } from "sequelize";

function RetailSale(sequelize) {
    return sequelize.define("RetailSale", {
        sale_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        cashier_id: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        customer_id: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM("completed ", "void", "returned"),
            allowNull: true
        },
        sub_total: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        tax_type: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        total_tax_amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        discount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        grand_total: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        payment_mode: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

}
export default RetailSale;