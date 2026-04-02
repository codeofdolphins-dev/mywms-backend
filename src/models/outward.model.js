import { DataTypes } from "sequelize";

function Outward(sequelize) {
    return sequelize.define("Outward", {
        outward_no: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        // Link to the associated Sales Order
        sales_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },


        // Internal Node ID of the company/location selling the goods
        seller_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        // FG Store ID who selling the goods
        store_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        // this will may target both node or vendor
        buyer_business_node_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("internal", "external"),
            defaultValue: "internal"
        },


        // User assigned to pick the items
        picker_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            defaultValue: "medium"
        },
        status: {
            type: DataTypes.ENUM("pending", "picking", "picked", "cancelled", "dispatched"),
            defaultValue: "pending"
        },
        required_by: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        dispatch_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    });
}
export default Outward;
