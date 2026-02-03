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
        Supplier,
        Inventory,
        Outward,
        OutwardItems,
        BillOfMaterial,
        Brand,
        UnitType,
        SupplierBrand,
        BrandProducts,
        CategoryProducts,
        TenantBusinessFlowMaster,
        BusinessNodeType,
        BusinessNode,
        PackageType,
        NodeUser,
        NodeDetails,
        RequisitionSupplier,
    } = models;

    // ******************************************** Self-Association *********************************
    // category → category
    Category.hasMany(Category, {
        as: "subcategories",
        foreignKey: "parent_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Category.belongsTo(Category, {
        as: "parent",
        foreignKey: "parent_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // parent → children
    BusinessNode.hasMany(BusinessNode, {
        foreignKey: "parent_node_id",
        as: "children",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    // child → parent
    BusinessNode.belongsTo(BusinessNode, {
        foreignKey: "parent_node_id",
        as: "parentNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // ********************************************One-To-One*********************************

    // product ↔ qty
    Product.hasOne(Batch, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Batch.belongsTo(Product, {
        foreignKey: "product_id",
        as: "batch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // tenant ↔ tenantsName
    TenantsName.hasOne(Tenant, {
        foreignKey: "tenant_id",
        as: "tenantDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Tenant.belongsTo(TenantsName, {
        foreignKey: "tenant_id",
        as: "tenantsName",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product ↔ requisitionItem
    Product.hasOne(RequisitionItem, {
        foreignKey: "product_id",
        as: "requisitionItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    RequisitionItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // hsn ↔ product
    HSN.hasOne(Product, {
        foreignKey: "hsn_id",
        as: "product", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(HSN, {
        foreignKey: "hsn_id",
        as: "hsn", // or just "hsn" if not already used
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // invoice ↔ inward
    Invoice.hasOne(Inward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Inward.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "purchaseInvoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode ↔ nodeDetails
    BusinessNode.hasOne(NodeDetails, {
        foreignKey: "business_node_id",
        as: "nodeDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeDetails.belongsTo(BusinessNode, {
        foreignKey: "business_node_id",
        as: "businessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // ********************************************One-To-Many*********************************

    // requisition <-> requisitionItem
    RequisitionItem.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "requisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Requisition.hasMany(RequisitionItem, {
        foreignKey: "requisition_id",
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition(PR) <-> Quotation
    Quotation.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "quotationRequisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Requisition.hasMany(Quotation, {
        foreignKey: "pr_id",
        as: "vendorQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // quotation ↔ quotationItems
    Quotation.hasMany(QuotationItems, {
        foreignKey: "quotation_id",
        as: "quotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    QuotationItems.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // purchasOrder(po) <-> user
    PurchasOrder.belongsTo(User, {
        foreignKey: "created_by",
        as: "POcreatedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "created_by",
        as: "POsCreater",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // purchasOrder(po) <-> user
    PurchasOrder.belongsTo(User, {
        foreignKey: "approved_by",
        as: "POapprovedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "approved_by",
        as: "POsApprover",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // purchaseOrderItems(poi) <-> purchasOrder(po)
    PurchaseOrderItems.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "purchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(PurchaseOrderItems, {
        foreignKey: "po_id",
        as: "purchasOrderDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // inward <-> purchasOrder(po)
    Inward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(Inward, {
        foreignKey: "po_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // invoice <-> purchasOrder(po)
    Invoice.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "invoicePurchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(Invoice, {
        foreignKey: "po_id",
        as: "purchasOrderInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // invoiceItems <-> invoice
    InvoiceItems.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "invoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Invoice.hasMany(InvoiceItems, {
        foreignKey: "invoice_id",
        as: "invoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // invoiceItems <-> product
    InvoiceItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "InvoiceItemProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(InvoiceItems, {
        foreignKey: "product_id",
        as: "productInvoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition - purchasOrder
    PurchasOrder.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "requisitions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Requisition.hasMany(PurchasOrder, {
        foreignKey: "pr_id",
        as: "purchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // inwardItem - product
    InwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "stockInwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(InwardItem, {
        foreignKey: "product_id",
        as: "stockInwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // inventory - product
    Inventory.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(Inventory, {
        foreignKey: "product_id",
        as: "inventoryProducts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // inventory - inward
    Inventory.belongsTo(Inward, {
        foreignKey: "last_inward_id",
        as: "inwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Inward.hasMany(Inventory, {
        foreignKey: "last_inward_id",
        as: "inventoryInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // inventory - outward
    Inventory.belongsTo(Outward, {
        foreignKey: "last_outward_id",
        as: "outwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Outward.hasMany(Inventory, {
        foreignKey: "last_outward_id",
        as: "inventoryOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // outwardItems <-> outward
    OutwardItems.belongsTo(Outward, {
        foreignKey: "outward_id",
        as: "outward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Outward.hasMany(OutwardItems, {
        foreignKey: "outward_id",
        as: "outwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // outward <-> user
    Outward.belongsTo(User, {
        foreignKey: "outward_by",
        as: "outwardBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(Outward, {
        foreignKey: "outward_by",
        as: "userOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // tenantsName ↔ tenantBusinessFlowMaster
    TenantBusinessFlowMaster.belongsTo(TenantsName, {
        foreignKey: "tenant_id",
        as: "tenant",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    TenantsName.hasMany(TenantBusinessFlowMaster, {
        foreignKey: "tenant_id",
        as: "businessFlows",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition <-> businessNode ==> BUYER
    Requisition.belongsTo(BusinessNode, {
        foreignKey: "buyer_business_node_id",
        as: "buyer",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(Requisition, {
        foreignKey: "buyer_business_node_id",
        as: "buyerRequisitions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // ********************************************Many-To-One*********************************

    // stockInward - stockInwardItems
    Inward.hasMany(InwardItem, {
        foreignKey: "stock_inward_id",
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    InwardItem.belongsTo(Inward, {
        foreignKey: "stock_inward_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // user - stock inward
    User.hasMany(Inward, {
        foreignKey: "inward_by",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Inward.belongsTo(User, {
        foreignKey: "inward_by",
        as: "inwardBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // user <-> requisition
    User.hasMany(Requisition, {
        foreignKey: "created_by",
        as: "requisitionDetails",
    });
    Requisition.belongsTo(User, {
        foreignKey: "created_by",
        as: "createdBy",
    });

    // product <-> quotationItems
    Product.hasMany(QuotationItems, {
        foreignKey: "product_id",
        as: "quotationItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    QuotationItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "quotedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product <-> purchaseOrderItems
    Product.hasMany(PurchaseOrderItems, {
        foreignKey: "product_id",
        as: "inwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchaseOrderItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInwarded",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product <-> outwardItems
    Product.hasMany(OutwardItems, {
        foreignKey: "product_id",
        as: "productOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    OutwardItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "outwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // batch <-> outwardItems
    Batch.hasMany(OutwardItems, {
        foreignKey: "batch_id",
        as: "batchOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    OutwardItems.belongsTo(Batch, {
        foreignKey: "batch_id",
        as: "outwardBatch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product <-> billOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "finished_product_id",
        as: "bomItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "finished_product_id",
        as: "finishedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product <-> billOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "raw_product_id",
        as: "usedInBoms",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "raw_product_id",
        as: "rawMaterial",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // unitType <-> product
    UnitType.hasMany(Product, {
        foreignKey: "unit_type",
        as: "unitProducts",
        sourceKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(UnitType, {
        foreignKey: "unit_type",
        as: "unitRef",
        targetKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // packageType <-> product
    PackageType.hasMany(Product, {
        foreignKey: "package_type",
        as: "productPackage",
        sourceKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(PackageType, {
        foreignKey: "package_type",
        as: "packageType",
        targetKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNodeType <-> businessNode
    BusinessNodeType.hasMany(BusinessNode, {
        foreignKey: "node_type_code",
        as: "nodes",
        sourceKey: "code",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.belongsTo(BusinessNodeType, {
        foreignKey: "node_type_code",
        as: "type",
        targetKey: "code",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // brand <-> requisitionItem
    Brand.hasMany(RequisitionItem, {
        foreignKey: "brand_id",
        as: "brandRequisitionItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    RequisitionItem.belongsTo(Brand, {
        foreignKey: "brand_id",
        as: "brand",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // category <-> requisitionItem
    Category.hasMany(RequisitionItem, {
        foreignKey: "category_id",
        as: "categoryRequisitionItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    RequisitionItem.belongsTo(Category, {
        foreignKey: "category_id",
        as: "category",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisitionItem -> category
    RequisitionItem.belongsTo(Category, {
        foreignKey: "sub_category_id",
        as: "subCategory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });


    // ********************************************Many-To-Many*********************************
    // user - role
    User.belongsToMany(Role, {
        through: {
            model: UserRoles,
            unique: false,
        },
        as: "roles",
        foreignKey: "userId",
        otherKey: "roleId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Role.belongsToMany(User, {
        through: {
            model: UserRoles,
            unique: false,
        },
        as: "users",
        foreignKey: "roleId",
        otherKey: "userId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // role - permission
    Role.belongsToMany(Permission, {
        through: {
            model: RolePermissions,
            unique: false,
        },
        as: "permissions",
        foreignKey: "roleId",
        otherKey: "permissionId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Permission.belongsToMany(Role, {
        through: {
            model: RolePermissions,
            unique: false,
        },
        as: "roles",
        foreignKey: "permissionId",
        otherKey: "roleId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // supplier - brand
    Supplier.belongsToMany(Brand, {
        through: {
            model: SupplierBrand,
            unique: false,
        },
        as: "brands",
        foreignKey: "supplier_id",
        otherKey: "brand_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Brand.belongsToMany(Supplier, {
        through: {
            model: SupplierBrand,
            unique: false,
        },
        as: "suppliers",
        foreignKey: "brand_id",
        otherKey: "supplier_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product - brand
    Product.belongsToMany(Brand, {
        through: {
            model: BrandProducts,
            unique: false,
        },
        as: "productBrands",
        foreignKey: "product_id",
        otherKey: "brand_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Brand.belongsToMany(Product, {
        through: {
            model: BrandProducts,
            unique: false,
        },
        as: "brandProducts",
        foreignKey: "brand_id",
        otherKey: "product_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product - category
    Product.belongsToMany(Category, {
        through: {
            model: CategoryProducts,
            unique: false,
        },
        as: "productCategories",
        foreignKey: "product_id",
        otherKey: "category_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Category.belongsToMany(Product, {
        through: {
            model: CategoryProducts,
            unique: false,
        },
        as: "categoryProducts",
        foreignKey: "category_id",
        otherKey: "product_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode - user
    BusinessNode.belongsToMany(User, {
        through: NodeUser,
        as: "businessNodeUser",
        foreignKey: "node_id",
        otherKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.belongsToMany(BusinessNode, {
        through: NodeUser,
        as: "userBusinessNode",
        foreignKey: "user_id",
        otherKey: "node_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Requisition - BusinessNode
    Requisition.belongsToMany(BusinessNode, {
        through: RequisitionSupplier,
        as: "supplierBusinessNode",
        foreignKey: "requisition_id",
        otherKey: "supplier_business_node_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.belongsToMany(Requisition, {
        through: RequisitionSupplier,
        as: "supplierRequisition",
        foreignKey: "supplier_business_node_id",
        otherKey: "requisition_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
};

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
        Supplier,
        Inventory,
        Outward,
        OutwardItems,
        BillOfMaterial,
        Brand,
        UnitType,
        SupplierBrand,
        BrandProducts,
        CategoryProducts,
        PackageType,
        NodeUser,
        NodeDetails,
        BusinessNode,
        BusinessNodeType,
        RequisitionSupplier,
    } = models;

    // ******************************************** Self-Association *********************************

    // category → category
    Category.hasMany(Category, {
        as: "subcategories",
        foreignKey: "parent_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Category.belongsTo(Category, {
        as: "parent",
        foreignKey: "parent_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // parent → children
    BusinessNode.hasMany(BusinessNode, {
        foreignKey: "parent_node_id",
        as: "children",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // child → parent
    BusinessNode.belongsTo(BusinessNode, {
        foreignKey: "parent_node_id",
        as: "parentNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // ********************************************One-To-One*********************************

    // product ↔ qty
    Product.hasOne(Batch, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Batch.belongsTo(Product, {
        foreignKey: "product_id",
        as: "batch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product ↔ requisitionItem
    Product.hasOne(RequisitionItem, {
        foreignKey: "product_id",
        as: "requisitionItem", // Product → RequisitionItem
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    RequisitionItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "product", // RequisitionItem → Product
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // hsn ↔ product
    HSN.hasOne(Product, {
        foreignKey: "hsn_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(HSN, {
        foreignKey: "hsn_id",
        as: "hsn",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Invoice ↔ Inward
    Invoice.hasOne(Inward, {
        foreignKey: "invoice_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Inward.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "purchaseInvoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // BusinessNode ↔ NodeDetails
    BusinessNode.hasOne(NodeDetails, {
        foreignKey: "business_node_id",
        as: "nodeDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeDetails.belongsTo(BusinessNode, {
        foreignKey: "business_node_id",
        as: "businessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // ********************************************One-To-Many*********************************

    // requisition <-> requisitionItem
    RequisitionItem.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "requisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Requisition.hasMany(RequisitionItem, {
        foreignKey: "requisition_id",
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition(PR) <-> Quotation
    Quotation.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "quotationRequisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Requisition.hasMany(Quotation, {
        foreignKey: "pr_id",
        as: "vendorQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Quotation ↔ QuotationItems
    Quotation.hasMany(QuotationItems, {
        foreignKey: "quotation_id",
        as: "quotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    QuotationItems.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "created_by",
        as: "POcreatedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "created_by",
        as: "POsCreater",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // PurchasOrder(PO) <-> User
    PurchasOrder.belongsTo(User, {
        foreignKey: "approved_by",
        as: "POapprovedBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(PurchasOrder, {
        foreignKey: "approved_by",
        as: "POsApprover",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // PurchaseOrderItems(POD) <-> PurchasOrder(PO)
    PurchaseOrderItems.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "purchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(PurchaseOrderItems, {
        foreignKey: "po_id",
        as: "purchasOrderDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Inward <-> PurchasOrder(PO)
    Inward.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "poReference",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(Inward, {
        foreignKey: "po_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Invoice <-> PurchasOrder(PO)
    Invoice.belongsTo(PurchasOrder, {
        foreignKey: "po_id",
        as: "invoicePurchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(Invoice, {
        foreignKey: "po_id",
        as: "purchasOrderInvoices",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // InvoiceItems <-> Invoice
    InvoiceItems.belongsTo(Invoice, {
        foreignKey: "invoice_id",
        as: "invoice",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Invoice.hasMany(InvoiceItems, {
        foreignKey: "invoice_id",
        as: "invoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // InvoiceItems <-> Product
    InvoiceItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "InvoiceItemProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(InvoiceItems, {
        foreignKey: "product_id",
        as: "productInvoiceItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Requisition - PurchasOrder
    PurchasOrder.belongsTo(Requisition, {
        foreignKey: "pr_id",
        as: "requisitions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Requisition.hasMany(PurchasOrder, {
        foreignKey: "pr_id",
        as: "purchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // InwardItem - Product
    InwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "stockInwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(InwardItem, {
        foreignKey: "product_id",
        as: "stockInwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Inventory - Product
    Inventory.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(Inventory, {
        foreignKey: "product_id",
        as: "inventoryProducts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Inventory - Inward
    Inventory.belongsTo(Inward, {
        foreignKey: "last_inward_id",
        as: "inwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Inward.hasMany(Inventory, {
        foreignKey: "last_inward_id",
        as: "inventoryInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Inventory - Outward
    Inventory.belongsTo(Outward, {
        foreignKey: "last_outward_id",
        as: "outwardInventory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Outward.hasMany(Inventory, {
        foreignKey: "last_outward_id",
        as: "inventoryOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // OutwardItems <-> Outward
    OutwardItems.belongsTo(Outward, {
        foreignKey: "outward_id",
        as: "outward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Outward.hasMany(OutwardItems, {
        foreignKey: "outward_id",
        as: "outwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Outward <-> user
    Outward.belongsTo(User, {
        foreignKey: "outward_by",
        as: "outwardBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(Outward, {
        foreignKey: "outward_by",
        as: "userOutward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition <-> businessNode ==> BUYER
    Requisition.belongsTo(BusinessNode, {
        foreignKey: "buyer_business_node_id",
        as: "buyer",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(Requisition, {
        foreignKey: "buyer_business_node_id",
        as: "buyerRequisitions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // ********************************************Many-To-One*********************************

    // stockInward - stockInwardItems
    Inward.hasMany(InwardItem, {
        foreignKey: "stock_inward_id",
        as: "items",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    InwardItem.belongsTo(Inward, {
        foreignKey: "stock_inward_id",
        as: "stockInward",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // User - stock inward
    User.hasMany(Inward, {
        foreignKey: "inward_by",
        as: "stockInwards",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Inward.belongsTo(User, {
        foreignKey: "inward_by",
        as: "inwardBy",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // user <-> requisition
    User.hasMany(Requisition, {
        foreignKey: "created_by",
        as: "requisitionDetails",
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
        onUpdate: "CASCADE",
    });
    QuotationItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "quotedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Warehouse <-> Invoice
    // Warehouse.hasMany(Invoice, {
    //     foreignKey: "warehouse_id",
    //     as: "warehouseInvoices",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });
    // Invoice.belongsTo(Warehouse, {
    //     foreignKey: "warehouse_id",
    //     as: "invoiceWarehouse",
    //     onDelete: "CASCADE",
    //     onUpdate: "CASCADE"
    // });

    // Product <-> InwardItem
    Product.hasMany(InwardItem, {
        foreignKey: "product_id",
        as: "inwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    InwardItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "productInwarded",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Product <-> OutwardItems
    Product.hasMany(OutwardItems, {
        foreignKey: "product_id",
        as: "productOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    OutwardItems.belongsTo(Product, {
        foreignKey: "product_id",
        as: "outwardProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Batch <-> OutwardItems
    Batch.hasMany(OutwardItems, {
        foreignKey: "batch_id",
        as: "batchOutwardItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    OutwardItems.belongsTo(Batch, {
        foreignKey: "batch_id",
        as: "outwardBatch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Product <-> BillOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "finished_product_id",
        as: "bomItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "finished_product_id",
        as: "finishedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Product <-> BillOfMaterial
    Product.hasMany(BillOfMaterial, {
        foreignKey: "raw_product_id",
        as: "usedInBoms",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BillOfMaterial.belongsTo(Product, {
        foreignKey: "raw_product_id",
        as: "rawMaterial",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // UnitType <-> Product
    UnitType.hasMany(Product, {
        foreignKey: "unit_type",
        as: "unitProducts",
        sourceKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(UnitType, {
        foreignKey: "unit_type",
        as: "unitRef",
        targetKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // PackageType <-> Product
    PackageType.hasMany(Product, {
        foreignKey: "package_type",
        as: "productPackage",
        sourceKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(PackageType, {
        foreignKey: "package_type",
        as: "packageType",
        targetKey: "name",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // BusinessNodeType <-> BusinessNode
    BusinessNodeType.hasMany(BusinessNode, {
        foreignKey: "node_type_code",
        as: "nodes",
        sourceKey: "code",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.belongsTo(BusinessNodeType, {
        foreignKey: "node_type_code",
        as: "type",
        targetKey: "code",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // brand <-> requisitionItem
    Brand.hasMany(RequisitionItem, {
        foreignKey: "brand_id",
        as: "brandRequisitionItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    RequisitionItem.belongsTo(Brand, {
        foreignKey: "brand_id",
        as: "brand",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // category <-> requisitionItem
    Category.hasMany(RequisitionItem, {
        foreignKey: "category_id",
        as: "categoryRequisitionItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    RequisitionItem.belongsTo(Category, {
        foreignKey: "category_id",
        as: "category",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisitionItem -> category
    RequisitionItem.belongsTo(Category, {
        foreignKey: "sub_category_id",
        as: "subCategory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });

    // ********************************************Many-To-Many*********************************
    // user - role
    User.belongsToMany(Role, {
        through: {
            model: UserRoles,
            unique: false,
        },
        as: "roles",
        foreignKey: "userId",
        otherKey: "roleId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Role.belongsToMany(User, {
        through: {
            model: UserRoles,
            unique: false,
        },
        as: "users",
        foreignKey: "roleId",
        otherKey: "userId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // role - permission
    Role.belongsToMany(Permission, {
        through: {
            model: RolePermissions,
            unique: false,
        },
        as: "permissions",
        foreignKey: "roleId",
        otherKey: "permissionId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Permission.belongsToMany(Role, {
        through: {
            model: RolePermissions,
            unique: false,
        },
        as: "roles",
        foreignKey: "permissionId",
        otherKey: "roleId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // supplier - brand
    Supplier.belongsToMany(Brand, {
        through: {
            model: SupplierBrand,
            unique: false,
        },
        as: "brands",
        foreignKey: "supplier_id",
        otherKey: "brand_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Brand.belongsToMany(Supplier, {
        through: {
            model: SupplierBrand,
            unique: false,
        },
        as: "suppliers",
        foreignKey: "brand_id",
        otherKey: "supplier_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product - brand
    Product.belongsToMany(Brand, {
        through: {
            model: BrandProducts,
            unique: false,
        },
        as: "productBrands",
        foreignKey: "product_id",
        otherKey: "brand_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Brand.belongsToMany(Product, {
        through: {
            model: BrandProducts,
            unique: false,
        },
        as: "brandProducts",
        foreignKey: "brand_id",
        otherKey: "product_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product - category
    Product.belongsToMany(Category, {
        through: {
            model: CategoryProducts,
            unique: false,
        },
        as: "productCategories",
        foreignKey: "product_id",
        otherKey: "category_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Category.belongsToMany(Product, {
        through: {
            model: CategoryProducts,
            unique: false,
        },
        as: "categoryProducts",
        foreignKey: "category_id",
        otherKey: "product_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode - user
    BusinessNode.belongsToMany(User, {
        through: NodeUser,
        as: "businessNodeUser",
        foreignKey: "node_id",
        otherKey: "user_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.belongsToMany(BusinessNode, {
        through: NodeUser,
        as: "userBusinessNode",
        foreignKey: "user_id",
        otherKey: "node_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // Requisition - BusinessNode
    Requisition.belongsToMany(BusinessNode, {
        through: RequisitionSupplier,
        as: "supplierBusinessNodes",
        foreignKey: "requisition_id",
        otherKey: "supplier_business_node_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.belongsToMany(Requisition, {
        through: RequisitionSupplier,
        as: "supplierRequisitions",
        foreignKey: "supplier_business_node_id",
        otherKey: "requisition_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
};

export { defineRootAssociations, defineTenantAssociations };
