import { DataTypes } from "sequelize";

function BpoIndentItem(sequelize) {
    return sequelize.define("BpoIndentItem", {
        indent_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        bpo_item_id: {
            type: DataTypes.INTEGER,
            allowNull: false // Links to BlanketOrderItems
        },
        release_qty: {
            type: DataTypes.DECIMAL(10, 3), // RM precision
            allowNull: false
        },
        unit_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false // Locked in from the BPO
        },
        line_total: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    });
}
export default BpoIndentItem;