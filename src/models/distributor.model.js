import { DataTypes } from "sequelize";

function Distributor(sequelize) {
    return sequelize.define("Distributor", {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        alter_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        logo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    // Distributor.associate = (models) => {
    //     Distributor.hasMany(models.Warehouse, { foreignKey: "distributor_id" });
    //     Distributor.hasMany(models.User, { foreignKey: "distributor_id" });
    //     Distributor.hasMany(models.Inward, { foreignKey: "distributor_id" });
    //     Distributor.hasMany(models.Outward, { foreignKey: "distributor_id" });
    //     Distributor.hasMany(models.Requisition, { foreignKey: "distributor_id" });
    // };
};

export default Distributor;