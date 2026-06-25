import { DataTypes } from "sequelize";

function ProductMapping(sequelize) {
    return sequelize.define("ProductMapping", {
        buyer_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        vendor_product_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        connection_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
}

export default ProductMapping;
