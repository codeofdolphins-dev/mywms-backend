const defineRootAssociations = (models) => {
    const {
        Category,
        CompanyDetails,
        IndividualDetails,
        Permission,
        Product,
        Role,
        RolePermissions,
        StockInward,
        StockInwardItem,
        User,
        UserRoles,
        Warehouse,
        Qty,
        Tenant,
        TenantsName,
        Requisition,
        RequisitionItem,
        HSN
    } = models;


    // ******************************************** Self-Association *********************************

    // category → category
    Category.hasMany(Category, {
        as: "subcategories",
        foreignKey: "parent_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Category.belongsTo(Category, {
        as: "parent",
        foreignKey: "parent_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


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

    // tenant ↔ tenantsName
    TenantsName.hasOne(Tenant, {
        foreignKey: "tenant_id",
        as: "tenantDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Tenant.belongsTo(TenantsName, {
        foreignKey: "tenant_id",
        as: "tenantsName",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // product ↔ requisitionItem
    Product.hasOne(RequisitionItem, {
        foreignKey: "barcode_id",
        as: "requisitionItem", // Product → RequisitionItem
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    RequisitionItem.belongsTo(Product, {
        foreignKey: "barcode_id",
        as: "product", // RequisitionItem → Product
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // hsn ↔ product
    HSN.hasOne(Product, {
        foreignKey: "hsn_id",
        as: "product", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.belongsTo(HSN, {
        foreignKey: "hsn_id",
        as: "hsn", // or just "hsn" if not already used
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************One-To-Many*********************************

    // requisition <-> requisitionItem
    RequisitionItem.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "requisition"
    });
    Requisition.hasMany(RequisitionItem, {
        foreignKey: "requisition_id",
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });




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

    // Category ↔ Product
    Category.hasMany(Product, {
        foreignKey: "category_id",
        as: "products",
    });
    Product.belongsTo(Category, {
        foreignKey: "category_id",
        as: "category",
    });

    Warehouse.hasMany(User, {
        foreignKey: "warehouse_id",
        as: "employees", // plural because it's a hasMany relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "workplace", // singular because each user belongs to one warehouse
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // user <-> requisition
    User.hasMany(Requisition, {
        foreignKey: "created_by",
        as: "requisitionDetails"
    });
    Requisition.belongsTo(User, {
        foreignKey: "created_by",
        as: "createdBy",
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

const defineTenantAssociations = (models) => {

    const {
        Category,
        CompanyDetails,
        IndividualDetails,
        Permission,
        Product,
        Role,
        RolePermissions,
        StockInward,
        StockInwardItem,
        User,
        UserRoles,
        Warehouse,
        Qty,
        RequisitionItem,
        Requisition,
        HSN

    } = models;


    // ******************************************** Self-Association *********************************

    // category → category
    Category.hasMany(Category, {
        as: "subcategories",
        foreignKey: "parent_id",
    });
    Category.belongsTo(Category, {
        as: "parent",
        foreignKey: "parent_id",
    });


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

    // product ↔ requisitionItem
    Product.hasOne(RequisitionItem, {
        foreignKey: "barcode_id",
        as: "requisitionItem", // Product → RequisitionItem
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    RequisitionItem.belongsTo(Product, {
        foreignKey: "barcode_id",
        as: "product", // RequisitionItem → Product
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // hsn ↔ product
    HSN.hasOne(Product, {
        foreignKey: "hsn_id",
        as: "product", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.belongsTo(HSN, {
        foreignKey: "hsn_id",
        as: "hsn", // or just "hsn" if not already used
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************One-To-Many*********************************

    // requisition <-> requisitionItem
    RequisitionItem.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "requisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Requisition.hasMany(RequisitionItem, {
        foreignKey: "requisition_id",
        as: "items"
    });




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

    // Category ↔ Product
    Category.hasMany(Product, {
        foreignKey: "category_id",
        as: "products",
    });
    Product.belongsTo(Category, {
        foreignKey: "category_id",
        as: "category",
    });

    Warehouse.hasMany(User, {
        foreignKey: "warehouse_id",
        as: "employees", // plural because it's a hasMany relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "workplace", // singular because each user belongs to one warehouse
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // user <-> requisition
    User.hasMany(Requisition, {
        foreignKey: "created_by",
        as: "requisitionDetails"
    });
    Requisition.belongsTo(User, {
        foreignKey: "created_by",
        as: "createdBy",
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

export { defineRootAssociations, defineTenantAssociations };