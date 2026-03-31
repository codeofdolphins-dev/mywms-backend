import { DataTypes } from "sequelize";

function ProductMapping(sequelize) {
    return sequelize.define("ProductMapping", {
        buyer_node: {
            type: DataTypes.STRING,
            allowNull: false
        },
        vendor_node: {
            type: DataTypes.STRING,
            allowNull: false
        },
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
}

export default ProductMapping;
