import { DataTypes } from "sequelize";

function IntercompanyRequisitionItems(sequelize) {
    return sequelize.define('IntercompanyRequisitionItems', {
        inter_comp_req_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        product_mapping_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        qty: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        brand: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sub_category: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    });
}

export default IntercompanyRequisitionItems;