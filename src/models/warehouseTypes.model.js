import { DataTypes } from "sequelize";

function WarehouseType(sequelize) {
    return sequelize.define("WarehouseType", {
        warehouse_type: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    });
}
export default WarehouseType;