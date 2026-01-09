const defineRootAssociations = (models) => {
    const {
        Category,
        User,
        Permission,
        Product,
        Role,
        RolePermissions,
        Inward,
        InwardItem,
        UserRoles,
        Warehouse,
        Batch,
        Tenant,
        TenantsName,
        Requisition,
        RequisitionItem,
        HSN,
        Quotation,
        QuotationItems,
        PurchasOrder,
        PurchaseOrderItems,
        Invoice,
        InvoiceItems,
        SupplierBankDetails,
        Inventory,
        Outward,
        OutwardItems,
        BillOfMaterial,
        Brand,
        Unit,
        // UserType,
        // WarehouseType,
        RequisitionRule,
        SupplierBrand,
        BrandProducts,
        CategoryProducts,
        TenantBusinessFlowMaster,
        NodeUserOwner,
        TenantBusinessFlow


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

    // User ↔ Warehouse
    User.hasOne(Warehouse, {
        foreignKey: "user_id",
        as: "warehouseDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ SupplierBankDetails
    User.hasOne(SupplierBankDetails, {
        foreignKey: "user_id",
        as: "supplierBankDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    SupplierBankDetails.belongsTo(User, {
        foreignKey: "user_id",
        as: "accOwner",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // product ↔ qty
    Product.hasOne(Batch, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Batch.belongsTo(Product, {
        foreignKey: "product_id",
        as: "batch",
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
        foreignKey: "product_id",
        as: "requisitionItem", // Product → RequisitionItem
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    RequisitionItem.belongsTo(Product, {
        foreignKey: "product_id",
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

    // Invoice ↔ Inward
    Invoice.hasOne(Inward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Inward.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "purchaseInvoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ NodeUserOwner
    User.hasOne(NodeUserOwner, {
        foreignKey: "user_id",
        as: "ownedNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    NodeUserOwner.belongsTo(User, {
        foreignKey: "user_id",
        as: "owner",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ NodeUserOwner
    User.hasOne(NodeUserOwner, {
        foreignKey: "parent_id",
        as: "parentNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    NodeUserOwner.belongsTo(User, {
        foreignKey: "parent_id",
        as: "parent",
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
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // requisition(PR) <-> Quotation
    Quotation.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "quotationRequisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Requisition.hasMany(Quotation, {
        foreignKey: "pr_id",
        as: "vendorQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Quotation ↔ QuotationItems
    Quotation.hasMany(QuotationItems, {
        foreignKey: "quotation_id",
        as: "quotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    QuotationItems.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "created_by",
        as: "POcreatedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "created_by",
        as: "POsCreater",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "approved_by",
        as: "POapprovedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "approved_by",
        as: "POsApprover",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseOrderItems(POD) <-> PurchasOrder(PO)
    PurchaseOrderItems.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "purchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(PurchaseOrderItems, {
        foreignKey: "po_id",
        as: "purchasOrderDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inward <-> PurchasOrder(PO)
    Inward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(Inward, {
        foreignKey: "po_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Invoice <-> PurchasOrder(PO)
    Invoice.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "invoicePurchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(Invoice, {
        foreignKey: "po_id",
        as: "purchasOrderInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // InvoiceItems <-> Invoice
    InvoiceItems.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "invoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Invoice.hasMany(InvoiceItems, {
        foreignKey: "invoice_id",
        as: "invoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // InvoiceItems <-> Product
    InvoiceItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "InvoiceItemProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(InvoiceItems, {
        foreignKey: "product_id",
        as: "productInvoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // // InwardItem <-> PurchaseOrderItems
    // InwardItem.belongsTo(PurchaseOrderItems, {
    //     foreignKey: "po_item_id",
    //     as: "poItemRef",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // PurchaseOrderItems.hasMany(InwardItem, {
    //     foreignKey: "po_item_id",
    //     as: "inwardedItems",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // Requisition - PurchasOrder
    PurchasOrder.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "requisitions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Requisition.hasMany(PurchasOrder, {
        foreignKey: "pr_id",
        as: "purchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // InwardItem - Product
    InwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "stockInwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(InwardItem, {
        foreignKey: "product_id",
        as: "stockInwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Product
    Inventory.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(Inventory, {
        foreignKey: "product_id",
        as: "inventoryProducts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Warehouse
    Inventory.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "warehouseInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Inventory, {
        foreignKey: "warehouse_id",
        as: "inventoryWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Inward
    Inventory.belongsTo(Inward, {
        foreignKey: "last_inward_id",
        as: "inwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Inward.hasMany(Inventory, {
        foreignKey: "last_inward_id",
        as: "inventoryInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inward - Warehouse
    Inward.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "warehouseInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Inward, {
        foreignKey: "warehouse_id",
        as: "inwardsWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Outward
    Inventory.belongsTo(Outward, {
        foreignKey: "last_outward_id",
        as: "outwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Outward.hasMany(Inventory, {
        foreignKey: "last_outward_id",
        as: "inventoryOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // OutwardItems <-> Outward
    OutwardItems.belongsTo(Outward, {
        foreignKey: "outward_id",
        as: "outward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Outward.hasMany(OutwardItems, {
        foreignKey: "outward_id",
        as: "outwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Outward <-> From_Warehouse
    Outward.belongsTo(Warehouse, {
        foreignKey: "host_warehouse_id",
        as: "hostWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Outward, {
        foreignKey: "host_warehouse_id",
        as: "hostWarehouseOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Outward <-> target_Warehouse
    Outward.belongsTo(Warehouse, {
        foreignKey: "target_warehouse_id",
        as: "targetWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Outward, {
        foreignKey: "target_warehouse_id",
        as: "targetWarehouseOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Outward <-> user
    Outward.belongsTo(User, {
        foreignKey: "outward_by",
        as: "outwardBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.hasMany(Outward, {
        foreignKey: "outward_by",
        as: "userOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Unit ↔ RequisitionItem
    RequisitionItem.belongsTo(Unit, {
        foreignKey: "uom_id",
        as: "unit"
    });
    Unit.hasMany(RequisitionItem, {
        foreignKey: "uom_id",
        as: "requisitionItemUnit"
    });

    // TenantsName ↔ TenantBusinessFlowMaster
    TenantBusinessFlowMaster.belongsTo(TenantsName, {
        foreignKey: "tenant_id",
        as: "tenant",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    TenantsName.hasMany(TenantBusinessFlowMaster, {
        foreignKey: "tenant_id",
        as: "businessFlows",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // TenantBusinessFlow ↔ NodeUserOwner
    NodeUserOwner.belongsTo(TenantBusinessFlow, {
        foreignKey: "node_id",
        as: "businessFlow",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    TenantBusinessFlow.hasMany(NodeUserOwner, {
        foreignKey: "node_id",
        as: "nodeOwners",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************Many-To-One*********************************

    // UserType ↔ RequisitionRule
    // UserType.hasMany(RequisitionRule, {
    //     foreignKey: "module_id",
    //     as: "moduleRules",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // RequisitionRule.belongsTo(UserType, {
    //     foreignKey: "module_id",
    //     as: "module",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // UserType ↔ User
    // UserType.hasMany(User, {
    //     foreignKey: "user_type_id",
    //     as: "userList",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // User.belongsTo(UserType, {
    //     foreignKey: "user_type_id",
    //     as: "userType",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // stockInward - stockInwardItems
    Inward.hasMany(InwardItem, {
        foreignKey: 'stock_inward_id',
        as: 'items',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    InwardItem.belongsTo(Inward, {
        foreignKey: 'stock_inward_id',
        as: 'stockInward',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User - stock inward
    User.hasMany(Inward, {
        foreignKey: "inward_by",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Inward.belongsTo(User, {
        foreignKey: "inward_by",
        as: "inwardBy",
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

    // Product <-> QuotationItems
    Product.hasMany(QuotationItems, {
        foreignKey: "product_id",
        as: "quotationItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    QuotationItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "quotedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Warehouse <-> Invoice
    Warehouse.hasMany(Invoice, {
        foreignKey: "warehouse_id",
        as: "warehouseInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Invoice.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "invoiceWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> PurchaseOrderItems
    Product.hasMany(PurchaseOrderItems, {
        foreignKey: "product_id",
        as: "inwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchaseOrderItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInwarded",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> OutwardItems
    Product.hasMany(OutwardItems, {
        foreignKey: "product_id",
        as: "productOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    OutwardItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "outwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Batch <-> OutwardItems
    Batch.hasMany(OutwardItems, {
        foreignKey: "batch_id",
        as: "batchOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    OutwardItems.belongsTo(Batch, {
        foreignKey: "batch_id",
        as: "outwardBatch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> BillOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "finished_product_id",
        as: "bomItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "finished_product_id",
        as: "finishedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> BillOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "raw_product_id",
        as: "usedInBoms",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "raw_product_id",
        as: "rawMaterial",
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

    // User - Brand
    User.belongsToMany(Brand, {
        through: {
            model: SupplierBrand,
            unique: false
        },
        as: "brands",
        foreignKey: 'supplierId',
        otherKey: 'brandId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Brand.belongsToMany(User, {
        through: {
            model: SupplierBrand,
            unique: false
        },
        as: "suppliers",
        foreignKey: 'brandId',
        otherKey: 'supplierId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // Product - Brand
    Product.belongsToMany(Brand, {
        through: {
            model: BrandProducts,
            unique: false
        },
        as: "productBrands",
        foreignKey: 'product_id',
        otherKey: 'brand_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Brand.belongsToMany(Product, {
        through: {
            model: BrandProducts,
            unique: false
        },
        as: "brandProducts",
        foreignKey: 'brand_id',
        otherKey: 'product_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // Product - Category
    Product.belongsToMany(Category, {
        through: {
            model: CategoryProducts,
            unique: false
        },
        as: "productCategories",
        foreignKey: 'product_id',
        otherKey: 'category_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Category.belongsToMany(Product, {
        through: {
            model: CategoryProducts,
            unique: false
        },
        as: "categoryProducts",
        foreignKey: 'category_id',
        otherKey: 'product_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Requisition - PurchasOrder
    // Requisition.belongsToMany(PurchasOrder, {
    //     through: {
    //         model: RequestOrder,
    //         unique: false
    //     },
    //     as: "purchaseOrders",
    //     foreignKey: 'prId',
    //     otherKey: 'poId',
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // PurchasOrder.belongsToMany(Requisition, {
    //     through: {
    //         model: RequestOrder,
    //         unique: false
    //     },
    //     as: "requisitions",
    //     foreignKey: 'poId',
    //     otherKey: 'prId',
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });    
}

const defineTenantAssociations = (models) => {

    const {
        Category,
        Permission,
        Product,
        Role,
        RolePermissions,
        Inward,
        InwardItem,
        User,
        UserRoles,
        Warehouse,
        Batch,
        RequisitionItem,
        Requisition,
        HSN,
        Quotation,
        QuotationItems,
        PurchasOrder,
        PurchaseOrderItems,
        Invoice,
        InvoiceItems,
        SupplierBankDetails,
        Inventory,
        Outward,
        OutwardItems,
        BillOfMaterial,
        Brand,
        Unit,
        // WarehouseType,
        // UserType,
        RequisitionRule,
        SupplierBrand,
        BrandProducts,
        CategoryProducts,
        NodeUserOwner,
        TenantBusinessFlow

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

    // User ↔ Warehouse
    User.hasOne(Warehouse, {
        foreignKey: "user_id",
        as: "warehouseDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ SupplierBankDetails
    User.hasOne(SupplierBankDetails, {
        foreignKey: "user_id",
        as: "supplierBankDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    SupplierBankDetails.belongsTo(User, {
        foreignKey: "user_id",
        as: "accOwner",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // UserType ↔ User
    // UserType.hasOne(User, {
    //     foreignKey: "user_type_id",
    //     as: "users",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // User.belongsTo(UserType, {
    //     foreignKey: "user_type_id",
    //     as: "userType",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // product ↔ qty
    Product.hasOne(Batch, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Batch.belongsTo(Product, {
        foreignKey: "product_id",
        as: "batch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    })

    // product ↔ requisitionItem
    Product.hasOne(RequisitionItem, {
        foreignKey: "product_id",
        as: "requisitionItem", // Product → RequisitionItem
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    RequisitionItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "product", // RequisitionItem → Product
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // hsn ↔ product
    HSN.hasOne(Product, {
        foreignKey: "hsn_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.belongsTo(HSN, {
        foreignKey: "hsn_id",
        as: "hsn",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Invoice ↔ Inward
    Invoice.hasOne(Inward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Inward.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "purchaseInvoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ NodeUserOwner
    User.hasOne(NodeUserOwner, {
        foreignKey: "user_id",
        as: "ownedNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    NodeUserOwner.belongsTo(User, {
        foreignKey: "user_id",
        as: "owner",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User ↔ NodeUserOwner
    User.hasOne(NodeUserOwner, {
        foreignKey: "parent_id",
        as: "parentNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    NodeUserOwner.belongsTo(User, {
        foreignKey: "parent_id",
        as: "parent",
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
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // requisition(PR) <-> Quotation
    Quotation.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "quotationRequisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Requisition.hasMany(Quotation, {
        foreignKey: "pr_id",
        as: "vendorQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Quotation ↔ QuotationItems
    Quotation.hasMany(QuotationItems, {
        foreignKey: "quotation_id",
        as: "quotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    QuotationItems.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "created_by",
        as: "POcreatedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "created_by",
        as: "POsCreater",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "approved_by",
        as: "POapprovedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "approved_by",
        as: "POsApprover",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseOrderItems(POD) <-> PurchasOrder(PO)
    PurchaseOrderItems.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "purchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(PurchaseOrderItems, {
        foreignKey: "po_id",
        as: "purchasOrderDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inward <-> PurchasOrder(PO)
    Inward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(Inward, {
        foreignKey: "po_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Invoice <-> PurchasOrder(PO)
    Invoice.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "invoicePurchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(Invoice, {
        foreignKey: "po_id",
        as: "purchasOrderInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // InvoiceItems <-> Invoice
    InvoiceItems.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "invoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Invoice.hasMany(InvoiceItems, {
        foreignKey: "invoice_id",
        as: "invoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // InvoiceItems <-> Product
    InvoiceItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "InvoiceItemProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(InvoiceItems, {
        foreignKey: "product_id",
        as: "productInvoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inward <-> Vendor
    // Inward.belongsTo(Vendor, {
    //     foreignKey: "vendor_id",
    //     as: "stockVendor",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // Vendor.hasMany(Inward, {
    //     foreignKey: "vendor_id",
    //     as: "vendorInwards",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // Requisition - PurchasOrder
    PurchasOrder.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "requisitions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Requisition.hasMany(PurchasOrder, {
        foreignKey: "pr_id",
        as: "purchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // InwardItem - Product
    InwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "stockInwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(InwardItem, {
        foreignKey: "product_id",
        as: "stockInwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Product
    Inventory.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(Inventory, {
        foreignKey: "product_id",
        as: "inventoryProducts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Warehouse
    Inventory.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "warehouseInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Inventory, {
        foreignKey: "warehouse_id",
        as: "inventoryWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Inward
    Inventory.belongsTo(Inward, {
        foreignKey: "last_inward_id",
        as: "inwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Inward.hasMany(Inventory, {
        foreignKey: "last_inward_id",
        as: "inventoryInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inward - Warehouse
    Inward.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "warehouseInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Inward, {
        foreignKey: "warehouse_id",
        as: "inwardsWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Inventory - Outward
    Inventory.belongsTo(Outward, {
        foreignKey: "last_outward_id",
        as: "outwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Outward.hasMany(Inventory, {
        foreignKey: "last_outward_id",
        as: "inventoryOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // OutwardItems <-> Outward
    OutwardItems.belongsTo(Outward, {
        foreignKey: "outward_id",
        as: "outward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Outward.hasMany(OutwardItems, {
        foreignKey: "outward_id",
        as: "outwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Outward <-> From_Warehouse
    Outward.belongsTo(Warehouse, {
        foreignKey: "host_warehouse_id",
        as: "hostWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Outward, {
        foreignKey: "host_warehouse_id",
        as: "hostWarehouseOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Outward <-> target_Warehouse
    Outward.belongsTo(Warehouse, {
        foreignKey: "target_warehouse_id",
        as: "targetWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Outward, {
        foreignKey: "target_warehouse_id",
        as: "targetWarehouseOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Outward <-> user
    Outward.belongsTo(User, {
        foreignKey: "outward_by",
        as: "outwardBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.hasMany(Outward, {
        foreignKey: "outward_by",
        as: "userOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Unit ↔ RequisitionItem
    RequisitionItem.belongsTo(Unit, {
        foreignKey: "uom_id",
        as: "unit"
    });
    Unit.hasMany(RequisitionItem, {
        foreignKey: "uom_id",
        as: "requisitionItemUnit"
    });

    // TenantBusinessFlow ↔ NodeUserOwner
    NodeUserOwner.belongsTo(TenantBusinessFlow, {
        foreignKey: "node_id",
        as: "businessFlow",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    TenantBusinessFlow.hasMany(NodeUserOwner, {
        foreignKey: "node_id",
        as: "nodeOwners",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************Many-To-One*********************************

    // UserType ↔ RequisitionRule
    // UserType.hasMany(RequisitionRule, {
    //     foreignKey: "module_id",
    //     as: "moduleRules",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // RequisitionRule.belongsTo(UserType, {
    //     foreignKey: "module_id",
    //     as: "module",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // UserType ↔ User
    // UserType.hasMany(User, {
    //     foreignKey: "user_type_id",
    //     as: "userList",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // User.belongsTo(UserType, {
    //     foreignKey: "user_type_id",
    //     as: "userType",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // stockInward - stockInwardItems
    Inward.hasMany(InwardItem, {
        foreignKey: 'stock_inward_id',
        as: 'items',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    InwardItem.belongsTo(Inward, {
        foreignKey: 'stock_inward_id',
        as: 'stockInward',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User - stock inward
    User.hasMany(Inward, {
        foreignKey: "inward_by",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Inward.belongsTo(User, {
        foreignKey: "inward_by",
        as: "inwardBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Warehouse.hasMany(User, {
    //     foreignKey: "warehouse_id",
    //     as: "employees", // plural because it's a hasMany relationship
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // User.belongsTo(Warehouse, {
    //     foreignKey: "warehouse_id",
    //     as: "workplace", // singular because each user belongs to one warehouse
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // user <-> requisition
    User.hasMany(Requisition, {
        foreignKey: "created_by",
        as: "requisitionDetails"
    });
    Requisition.belongsTo(User, {
        foreignKey: "created_by",
        as: "createdBy",
    });


    // Product <-> QuotationItems
    Product.hasMany(QuotationItems, {
        foreignKey: "product_id",
        as: "quotationItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    QuotationItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "quotedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Warehouse <-> Invoice
    Warehouse.hasMany(Invoice, {
        foreignKey: "warehouse_id",
        as: "warehouseInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Invoice.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "invoiceWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> InwardItem
    Product.hasMany(InwardItem, {
        foreignKey: "product_id",
        as: "inwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    InwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInwarded",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> OutwardItems
    Product.hasMany(OutwardItems, {
        foreignKey: "product_id",
        as: "productOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    OutwardItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "outwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Batch <-> OutwardItems
    Batch.hasMany(OutwardItems, {
        foreignKey: "batch_id",
        as: "batchOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    OutwardItems.belongsTo(Batch, {
        foreignKey: "batch_id",
        as: "outwardBatch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> BillOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "finished_product_id",
        as: "bomItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "finished_product_id",
        as: "finishedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product <-> BillOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "raw_product_id",
        as: "usedInBoms",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "raw_product_id",
        as: "rawMaterial",
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

    // User - Brand
    User.belongsToMany(Brand, {
        through: {
            model: SupplierBrand,
            unique: false
        },
        as: "brands",
        foreignKey: 'supplierId',
        otherKey: 'brandId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Brand.belongsToMany(User, {
        through: {
            model: SupplierBrand,
            unique: false
        },
        as: "suppliers",
        foreignKey: 'brandId',
        otherKey: 'supplierId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Product - Brand
    Product.belongsToMany(Brand, {
        through: {
            model: BrandProducts,
            unique: false
        },
        as: "productBrands",
        foreignKey: 'product_id',
        otherKey: 'brand_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Brand.belongsToMany(Product, {
        through: {
            model: BrandProducts,
            unique: false
        },
        as: "brandProducts",
        foreignKey: 'brand_id',
        otherKey: 'product_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // Product - Category
    Product.belongsToMany(Category, {
        through: {
            model: CategoryProducts,
            unique: false
        },
        as: "productCategories",
        foreignKey: 'product_id',
        otherKey: 'category_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Category.belongsToMany(Product, {
        through: {
            model: CategoryProducts,
            unique: false
        },
        as: "categoryProducts",
        foreignKey: 'category_id',
        otherKey: 'product_id',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // Requisition - PurchasOrder
    // Requisition.belongsToMany(PurchasOrder, {
    //     through: {
    //         model: RequestOrder,
    //         unique: false
    //     },
    //     as: "purchaseOrders",
    //     foreignKey: 'prId',
    //     otherKey: 'poId',
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // PurchasOrder.belongsToMany(Requisition, {
    //     through: {
    //         model: RequestOrder,
    //         unique: false
    //     },
    //     as: "requisitions",
    //     foreignKey: 'poId',
    //     otherKey: 'prId',
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
}

export { defineRootAssociations, defineTenantAssociations };