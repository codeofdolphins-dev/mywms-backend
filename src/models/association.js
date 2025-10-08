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
        Vendor,
        VendorBankDetails,
        // RequestOrder
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


    // Vendor ↔ Quotation
    Vendor.hasOne(Quotation, {
        foreignKey: "vendor_id",
        as: "quotation", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Quotation.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "vendor", // or just "hsn" if not already used
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Invoice ↔ StockInward
    Invoice.hasOne(StockInward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(Invoice, {
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

    // PurchaseOrderItems(POD) <-> PurchasOrder(PO)
    StockInward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(StockInward, {
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

    // // StockInwardItem <-> PurchaseOrderItems
    // StockInwardItem.belongsTo(PurchaseOrderItems, {
    //     foreignKey: "po_item_id",
    //     as: "poItemRef",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // PurchaseOrderItems.hasMany(StockInwardItem, {
    //     foreignKey: "po_item_id",
    //     as: "inwardedItems",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // StockInward <-> Vendor
    StockInward.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "stockVendor",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Vendor.hasMany(StockInward, {
        foreignKey: "vendor_id",
        as: "vendorInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

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
    
    // StockInwardItem - Product
    StockInwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "stockInwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(StockInwardItem, {
        foreignKey: "product_id",
        as: "stockInwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    
    // Batch - Warehouse
    Batch.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "batchWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Batch, {
        foreignKey: "warehouse_id",
        as: "warehouseBatches",
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

    // // Vendor <-> Invoice        // NOTE: Keep sample
    // Vendor.hasMany(Invoice, {
    //     foreignKey: "vendor_id",
    //     as: "vendorInvoices",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // Invoice.belongsTo(Vendor, {
    //     foreignKey: "vendor_id",
    //     as: "invoiceVendor",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

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
        Vendor,
        VendorBankDetails,
        // RequestOrder,

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

    // Vendor ↔ Quotation
    Vendor.hasOne(Quotation, {
        foreignKey: "vendor_id",
        as: "quotation",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Quotation.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // // PurchasOrder(PO) <-> User
    // PurchasOrder.belongsTo(User, {
    //     foreignKey: "created_by",
    //     as: "POcreatedBy"
    // });
    // User.hasMany(PurchasOrder, {
    //     foreignKey: "created_by",
    //     as: "POsCreater",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // // PurchasOrder(PO) <-> User
    // PurchasOrder.belongsTo(User, {
    //     foreignKey: "approved_by",
    //     as: "POapprovedBy"
    // });
    // User.hasMany(PurchasOrder, {
    //     foreignKey: "approved_by",
    //     as: "POsApprover",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // Invoice ↔ StockInward
    Invoice.hasOne(StockInward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    StockInward.belongsTo(Invoice, {
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

    // StockInward <-> PurchasOrder(PO)
    StockInward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    PurchasOrder.hasMany(StockInward, {
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

    // // StockInwardItem <-> PurchaseOrderItems
    // StockInwardItem.belongsTo(PurchaseOrderItems, {
    //     foreignKey: "po_item_id",
    //     as: "poItemRef",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // PurchaseOrderItems.hasMany(StockInwardItem, {
    //     foreignKey: "po_item_id",
    //     as: "inwardedItems",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // StockInward <-> Vendor
    StockInward.belongsTo(Vendor, {
        foreignKey: "vendor_id",
        as: "stockVendor",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Vendor.hasMany(StockInward, {
        foreignKey: "vendor_id",
        as: "vendorInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

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

    // StockInwardItem - Product
    StockInwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "stockInwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Product.hasMany(StockInwardItem, {
        foreignKey: "product_id",
        as: "stockInwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // Batch - Warehouse
    Batch.belongsTo(Warehouse, {
        foreignKey: "warehouse_id",
        as: "batchWarehouse",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    Warehouse.hasMany(Batch, {
        foreignKey: "warehouse_id",
        as: "warehouseBatches",
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