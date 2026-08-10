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
            type: DataTypes.INTEGER,
            allowNull: false
        },
        customer_id: {
            type: DataTypes.INTEGER,
            allowNull: true         // anonymous walk-in sales have no customer record
        },
        status: {
            type: DataTypes.ENUM("completed", "void", "returned"),
            allowNull: true
        },
        sub_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        tax_type: {
            type: DataTypes.ENUM("inter", "intra", "noTax"),
            allowNull: false
        },
        total_tax_amount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        discount: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        grand_total: {
            type: DataTypes.DECIMAL(18, 2),
            allowNull: false
        },
        payment_mode: {
            type: DataTypes.ENUM("cash", "card", "upi"),
            allowNull: false
        },
        payment_details: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    });

}
export default RetailSale;