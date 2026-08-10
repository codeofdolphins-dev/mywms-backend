import { DataTypes } from "sequelize";

function Invoice(sequelize) {
    return sequelize.define("Invoice", {
        seller_tenant: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        seller_businessNode_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        seller_store_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        
        
        buyer_tenant: {
            type: DataTypes.STRING,
            allowNull: true,        // null for b2c — a retail customer has no tenant
        },
        buyer_businessNode_id: {
            type: DataTypes.INTEGER,
            allowNull: true,        // null for b2c — a retail customer has no node
        },
        // buyer_store_id: {
        //     type: DataTypes.INTEGER,
        //     allowNull: true,
        // },


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
        tax_type: {
            type: DataTypes.ENUM("intra", "inter", "noTax"),
            allowNull: false,
            defaultValue: "noTax",
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

        outward_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        invoice_type: {
            type: DataTypes.ENUM("b2b", "b2c"),
            allowNull: false,
            defaultValue: "b2b",
        },
        // source retail sale when invoice_type is b2c — mirrors outward_id for the b2b flow
        retail_sale_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    });
}
export default Invoice;
