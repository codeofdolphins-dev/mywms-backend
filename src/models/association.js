const defineAssociations = (models) => {

    const {
        Category,
        CompanyDetails,
        District,
        Driver,
        IndividualDetails,
        Permission,
        Product,
        Role,
        RolePermissions,
        State,
        StockInward,
        StockInwardItem,
        User,
        UserRoles,
        Vehicle,
        Warehouse,
        Qty

    } = models;

    // ********************************************One-To-One*********************************

    // User ↔ CompanyDetails
    User.hasOne(CompanyDetails, {
        foreignKey: "user_id",
        as: "companyDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    CompanyDetails.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ IndividualDetails
    User.hasOne(IndividualDetails, {
        foreignKey: "user_id",
        as: "individualDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    IndividualDetails.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ Warehouse
    User.hasOne(Warehouse, {
        foreignKey: "user_id",
        as: "warehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    
    // product ↔ qty
    Product.hasOne(Qty, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Qty.belongsTo(Product, {
        foreignKey: "product_id",
        as: "quantity",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"    
    })


    // ********************************************One-To-Many*********************************





    // ********************************************Many-To-One*********************************

    // stockInward - stockInwardItems
    StockInward.hasMany(StockInwardItem, {
        foreignKey: 'stockInwardId',
        as: 'items',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInwardItem.belongsTo(StockInward, {
        foreignKey: 'stockInwardId',
        as: 'stockInward',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Company - Products
    CompanyDetails.hasMany(Product, {
        foreignKey: 'company_id',
        as: 'products',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.belongsTo(CompanyDetails, {
        foreignKey: 'company_id',
        as: 'company',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // company - stosk Inward
    CompanyDetails.hasMany(StockInward, {
        foreignKey: "company_id",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(CompanyDetails, {
        foreignKey: "company_id",
        as: "company",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User - stock inward
    User.hasMany(StockInward, {
        foreignKey: "user_id",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************Many-To-Many*********************************
    // user - role
    User.belongsToMany(Role, {
        through: {
            model: UserRoles,
            unique: false
        },
        as: "roles",
        foreignKey: 'userId',
        otherKey: 'roleId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Role.belongsToMany(User, {
        through: {
            model: UserRoles,
            unique: false
        },
        as: "users",
        foreignKey: 'roleId',
        otherKey: 'userId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // role - permission
    Role.belongsToMany(Permission, {
        through: {
            model: RolePermissions,
            unique: false
        },
        as: "permissions",
        foreignKey: 'roleId',
        otherKey: 'permissionId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Permission.belongsToMany(Role, {
        through: {
            model: RolePermissions,
            unique: false
        },
        as: "roles",
        foreignKey: 'permissionId',
        otherKey: 'roleId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
}

export default defineAssociations;