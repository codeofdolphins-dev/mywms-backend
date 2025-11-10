import { DataTypes } from "sequelize";

function Supplier(sequelize) {
    return sequelize.define("Supplier", {
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        contact_person: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        state_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        district_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        pincode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        profile_image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true
        },
    });

    //   Supplier.associate = (models) => {
    //     Supplier.hasMany(models.Requisition, { foreignKey: "supplier_id" });
    //     Supplier.hasMany(models.Outward, { foreignKey: "supplier_id" });
    //     Supplier.hasOne(models.User, { foreignKey: "supplier_id" }); // for login
    //   };
};

export default Supplier;