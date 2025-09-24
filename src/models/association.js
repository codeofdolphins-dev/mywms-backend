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
        HSN,
        VendorQuotation,
        VendorQuotationItems,
        PurchasOrder,
        PurchaseOrderItems,
        PurchaseInvoice,
        PurchaseInvoiceItems,
        Vendor,
        VendorBankDetails,
        RequestOrder
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


    // Vendor ↔ VendorQuotation
    Vendor.hasOne(VendorQuotation, {
        foreignKey: "vendor_id",
        as: "quotation", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorQuotation.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "vendor", // or just "hsn" if not already used
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // VendorQuotation ↔ VendorQuotationItems
    VendorQuotation.hasOne(VendorQuotationItems, {
        foreignKey: "quotation_id",
        as: "quotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorQuotationItems.belongsTo(VendorQuotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseInvoice ↔ StockInward
    PurchaseInvoice.hasOne(StockInward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(PurchaseInvoice, {
        foreignKey: "invoice_id",
        as: "purchaseInvoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Vendor ↔ VendorBankDetails
    Vendor.hasOne(VendorBankDetails, {
        foreignKey: "vendor_id",
        as: "BankDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorBankDetails.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "accOwner",
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

    // requisition(PR) <-> VendorQuotation
    VendorQuotation.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "quotationRequisition"
    });
    Requisition.hasMany(VendorQuotation, {
        foreignKey: "pr_id",
        as: "vendorQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "created_by",
        as: "POcreatedBy"
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
        as: "POapprovedBy"
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
        as: "purchasOrder"
    });
    PurchasOrder.hasMany(PurchaseOrderItems, {
        foreignKey: "po_id",
        as: "purchasOrderDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseOrderItems(POD) <-> PurchasOrder(PO)
    StockInward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference"
    });
    PurchasOrder.hasMany(StockInward, {
        foreignKey: "po_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseInvoice <-> PurchasOrder(PO)
    PurchaseInvoice.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "invoicePO"
    });
    PurchasOrder.hasMany(PurchaseInvoice, {
        foreignKey: "po_id",
        as: "poInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseInvoiceItems <-> PurchaseInvoice
    PurchaseInvoiceItems.belongsTo(PurchaseInvoice, {
        foreignKey: "invoice_id",
        as: "invoiceItems"
    });
    PurchaseInvoice.hasMany(PurchaseInvoiceItems, {
        foreignKey: "invoice_id",
        as: "invoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseInvoiceItems <-> PurchaseOrderItems
    PurchaseInvoiceItems.belongsTo(PurchaseOrderItems, {
        foreignKey: "po_item_id",
        as: "poItem"
    });
    PurchaseOrderItems.hasMany(PurchaseInvoiceItems, {
        foreignKey: "po_item_id",
        as: "poItemInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // StockInwardItem <-> PurchaseOrderItems
    StockInwardItem.belongsTo(PurchaseOrderItems, {
        foreignKey: "po_item_id",
        as: "poItemRef"
    });
    PurchaseOrderItems.hasMany(StockInwardItem, {
        foreignKey: "po_item_id",
        as: "inwardedItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    
    // StockInward <-> Vendor
    StockInward.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "stockVendor"
    });
    Vendor.hasMany(StockInward, {
        foreignKey: "vendor_id",
        as: "vendorInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************Many-To-One*********************************

    // stockInward - stockInwardItems
    StockInward.hasMany(StockInwardItem, {
        foreignKey: 'stock_inward_id',
        as: 'items',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInwardItem.belongsTo(StockInward, {
        foreignKey: 'stock_inward_id',
        as: 'stockInward',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User - stock inward
    User.hasMany(StockInward, {
        foreignKey: "inward_by",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(User, {
        foreignKey: "inward_by",
        as: "inwardBy",
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
        as: "employees",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    User.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "workplace",
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

    // Product <-> VendorQuotationItems
    Product.hasMany(VendorQuotationItems, {
        foreignKey: "product_id",
        as: "quotationItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorQuotationItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "quotedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Vendor <-> PurchaseInvoice
    Vendor.hasMany(PurchaseInvoice, {
        foreignKey: "vendor_id",
        as: "vendorInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchaseInvoice.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "invoiceVendor",
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

    // Requisition - PurchasOrder
    Requisition.belongsToMany(PurchasOrder, {
        through: {
            model: RequestOrder,
            unique: false
        },
        as: "purchaseOrders",
        foreignKey: 'prId',
        otherKey: 'poId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.belongsToMany(Requisition, {
        through: {
            model: RequestOrder,
            unique: false
        },
        as: "requisitions",
        foreignKey: 'poId',
        otherKey: 'prId',
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
        HSN,
        VendorQuotation,
        VendorQuotationItems,
        PurchasOrder,
        PurchaseOrderItems,
        PurchaseInvoice,
        PurchaseInvoiceItems,
        Vendor,
        VendorBankDetails,
        RequestOrder,

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

    // Vendor ↔ VendorQuotation
    Vendor.hasOne(VendorQuotation, {
        foreignKey: "vendor_id",
        as: "quotation", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorQuotation.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "vendor", // or just "hsn" if not already used
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // VendorQuotation ↔ VendorQuotationItems
    VendorQuotation.hasOne(VendorQuotationItems, {
        foreignKey: "quotation_id",
        as: "quotationItem", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorQuotationItems.belongsTo(VendorQuotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails", // or just "hsn" if not already used
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "created_by",
        as: "POcreatedBy"
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
        as: "POapprovedBy"
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "approved_by",
        as: "POsApprover",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseInvoice ↔ StockInward
    PurchaseInvoice.hasOne(StockInward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(PurchaseInvoice, {
        foreignKey: "invoice_id",
        as: "purchaseInvoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    
    // Vendor ↔ VendorBankDetails
    Vendor.hasOne(VendorBankDetails, {
        foreignKey: "vendor_id",
        as: "BankDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorBankDetails.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "accOwner",
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

    // requisition(PR) <-> VendorQuotation
    VendorQuotation.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "quotationRequisition"
    });
    Requisition.hasMany(VendorQuotation, {
        foreignKey: "pr_id",
        as: "vendorQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "created_by",
        as: "POcreatedBy"
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
        as: "POapprovedBy"
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
        as: "purchasOrder"
    });
    PurchasOrder.hasMany(PurchaseOrderItems, {
        foreignKey: "po_id",
        as: "purchasOrderDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // StockInward <-> PurchasOrder(PO)
    StockInward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference"
    });
    PurchasOrder.hasMany(StockInward, {
        foreignKey: "po_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseInvoice <-> PurchasOrder(PO)
    PurchaseInvoice.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "invoicePO"
    });
    PurchasOrder.hasMany(PurchaseInvoice, {
        foreignKey: "po_id",
        as: "poInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // PurchaseInvoiceItems <-> PurchaseInvoice
    PurchaseInvoiceItems.belongsTo(PurchaseInvoice, {
        foreignKey: "invoice_id",
        as: "invoiceItems"
    });
    PurchaseInvoice.hasMany(PurchaseInvoiceItems, {
        foreignKey: "invoice_id",
        as: "invoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    
    // PurchaseInvoiceItems <-> PurchaseOrderItems
    PurchaseInvoiceItems.belongsTo(PurchaseOrderItems, {
        foreignKey: "po_item_id",
        as: "poItem"
    });
    PurchaseOrderItems.hasMany(PurchaseInvoiceItems, {
        foreignKey: "po_item_id",
        as: "poItemInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // StockInwardItem <-> PurchaseOrderItems
    StockInwardItem.belongsTo(PurchaseOrderItems, {
        foreignKey: "po_item_id",
        as: "poItemRef"
    });
    PurchaseOrderItems.hasMany(StockInwardItem, {
        foreignKey: "po_item_id",
        as: "inwardedItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // StockInward <-> Vendor
    StockInward.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "stockVendor"
    });
    Vendor.hasMany(StockInward, {
        foreignKey: "vendor_id",
        as: "vendorInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************Many-To-One*********************************

    // stockInward - stockInwardItems
    StockInward.hasMany(StockInwardItem, {
        foreignKey: 'stock_inward_id',
        as: 'items',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInwardItem.belongsTo(StockInward, {
        foreignKey: 'stock_inward_id',
        as: 'stockInward',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // User - stock inward
    User.hasMany(StockInward, {
        foreignKey: "inward_by",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(User, {
        foreignKey: "inward_by",
        as: "inwardBy",
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


    // Product <-> VendorQuotationItems
    Product.hasMany(VendorQuotationItems, {
        foreignKey: "product_id",
        as: "quotationItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    VendorQuotationItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "quotedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Vendor <-> PurchaseInvoice
    Vendor.hasMany(PurchaseInvoice, {
        foreignKey: "vendor_id",
        as: "vendorInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchaseInvoice.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "invoiceVendor",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    
    // Product <-> StockInwardItem
    Product.hasMany(StockInwardItem, {
        foreignKey: "product_id",
        as: "inwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInwarded",
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


    // Requisition - PurchasOrder
    Requisition.belongsToMany(PurchasOrder, {
        through: {
            model: RequestOrder,
            unique: false
        },
        as: "purchaseOrders",
        foreignKey: 'prId',
        otherKey: 'poId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.belongsToMany(Requisition, {
        through: {
            model: RequestOrder,
            unique: false
        },
        as: "requisitions",
        foreignKey: 'poId',
        otherKey: 'prId',
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
}

export { defineRootAssociations, defineTenantAssociations };