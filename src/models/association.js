const defineRootAssociations = (models) => {
    const {
        Category,
        User,
        Permission,
        Product,
        Role,
        RolePermissions,
        UserRoles,
        NodeBatch,
        Tenant,
        TenantsName,
        Requisition,
        RequisitionItem,
        HSN,
        Quotation,
        QuotationItem,
        PurchasOrder,
        PurchaseOrderItem,
        Invoice,
        InvoiceItems,
        Supplier,
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
        TenantBusinessFlow,
        NodeStockLedger,
        GRN,
        GRNItem,


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
        foreignKey: "hsn_code",
        sourceKey: "hsn_code",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(HSN, {
        foreignKey: "hsn_code",
        targetKey: "hsn_code",
        as: "hsn",
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

    // RequisitionItem ↔ QuotationItem
    RequisitionItem.hasOne(QuotationItem, {
        foreignKey: "requisition_item_id",
        as: "linkedQuotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    QuotationItem.belongsTo(RequisitionItem, {
        foreignKey: "requisition_item_id",
        as: "sourceRequisitionItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisitionItem ↔ purchaseOrderItem
    RequisitionItem.hasOne(PurchaseOrderItem, {
        foreignKey: "requisition_item_id",
        as: "linkedPurchaseOrderItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchaseOrderItem.belongsTo(RequisitionItem, {
        foreignKey: "requisition_item_id",
        as: "poi_sourceRequisitionItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition(PR) <-> quotation
    Requisition.hasOne(Quotation, {
        foreignKey: "requisition_id",
        as: "requisitionQuotation",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Quotation.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "quotationRequisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // quotation <-> purchasOrder
    Quotation.hasOne(PurchasOrder, {
        foreignKey: "quotation_id",
        as: "linkedPurchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "linkedQuotation",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition - purchasOrder
    Requisition.hasOne(PurchasOrder, {
        foreignKey: "requisition_id",
        as: "purchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "requisitions",
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


    // quotation ↔ quotationItem
    Quotation.hasMany(QuotationItem, {
        foreignKey: "quotation_id",
        as: "quotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    QuotationItem.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });






    /************* PURCHASE ORDER (PO) ********************/
    // purchaseOrderItem(POD) <-> purchasOrder(PO)
    PurchaseOrderItem.belongsTo(PurchasOrder, {
        foreignKey: "purchase_order_id",
        as: "purchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(PurchaseOrderItem, {
        foreignKey: "purchase_order_id",
        as: "purchasOrderItems",
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

    // purchasOrder - businessNode
    PurchasOrder.belongsTo(BusinessNode, {
        foreignKey: "form_business_node_id",
        as: "poFormBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(PurchasOrder, {
        foreignKey: "form_business_node_id",
        as: "fromPurchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // purchasOrder - businessNode
    PurchasOrder.belongsTo(BusinessNode, {
        foreignKey: "to_business_node_id",
        as: "poToBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(PurchasOrder, {
        foreignKey: "to_business_node_id",
        as: "toPurchaseOrders",
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


    // quotation <-> businessNode
    Quotation.belongsTo(BusinessNode, {
        foreignKey: "from_business_node_id",
        as: "fromBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(Quotation, {
        foreignKey: "from_business_node_id",
        as: "sentQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // quotation <-> businessNode
    Quotation.belongsTo(BusinessNode, {
        foreignKey: "to_business_node_id",
        as: "toBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(Quotation, {
        foreignKey: "to_business_node_id",
        as: "receivedQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // quotation <-> User
    Quotation.belongsTo(User, {
        foreignKey: "created_by",
        as: "quotationCreated",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(Quotation, {
        foreignKey: "created_by",
        as: "createQuotation",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode <-> tenantBusinessFlow
    BusinessNode.belongsTo(TenantBusinessFlow, {
        foreignKey: "tenant_business_flow_id",
        as: "parentFlow",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    TenantBusinessFlow.hasMany(BusinessNode, {
        foreignKey: "tenant_business_flow_id",
        as: "flowNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });


    /** grn */

    // grnItem <-> grn
    GRNItem.belongsTo(GRN, {
        foreignKey: "grn_id",
        as: "grn",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    GRN.hasMany(GRNItem, {
        foreignKey: "grn_id",
        as: "grnLineItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grn <-> purchasOrder
    GRN.belongsTo(PurchasOrder, {
        foreignKey: "purchase_order_id",
        as: "grnPurchaseOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(GRN, {
        foreignKey: "purchase_order_id",
        as: "grns",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grn <-> businessNode
    GRN.belongsTo(BusinessNode, {
        foreignKey: "from_node_id",
        as: "fromNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(GRN, {
        foreignKey: "from_node_id",
        as: "fromGrns",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grn <-> businessNode
    GRN.belongsTo(BusinessNode, {
        foreignKey: "to_node_id",
        as: "toNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(GRN, {
        foreignKey: "to_node_id",
        as: "toGrns",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });


    // grnItem <-> purchaseOrderItem
    GRNItem.belongsTo(PurchaseOrderItem, {
        foreignKey: "purchase_order_item_id",
        as: "poItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchaseOrderItem.hasMany(GRNItem, {
        foreignKey: "purchase_order_item_id",
        as: "grnItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grnItem <-> product
    GRNItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "grnProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(GRNItem, {
        foreignKey: "product_id",
        as: "grnItemsForProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });


    // ********************************************Many-To-One*********************************

    // user <-> requisition
    User.hasMany(Requisition, {
        foreignKey: "created_by",
        as: "requisitionDetails",
    });
    Requisition.belongsTo(User, {
        foreignKey: "created_by",
        as: "createdBy",
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

    // product ↔ nodeBatch
    Product.hasMany(NodeBatch, {
        foreignKey: "product_id",
        as: "batch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeBatch.belongsTo(Product, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode ↔ nodeBatch
    BusinessNode.hasMany(NodeBatch, {
        foreignKey: "business_node_id",
        as: "inventoryBatches",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeBatch.belongsTo(BusinessNode, {
        foreignKey: "business_node_id",
        as: "inventoryNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product ↔ nodeStockLedger
    Product.hasMany(NodeStockLedger, {
        foreignKey: "product_id",
        as: "stockLedgers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(Product, {
        foreignKey: "product_id",
        as: "linkedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode ↔ nodeStockLedger
    BusinessNode.hasMany(NodeStockLedger, {
        foreignKey: "from_node_id",
        as: "formStockLedgers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(BusinessNode, {
        foreignKey: "from_node_id",
        as: "sourceNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode ↔ nodeStockLedger
    BusinessNode.hasMany(NodeStockLedger, {
        foreignKey: "to_node_id",
        as: "toStockLedgers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(BusinessNode, {
        foreignKey: "to_node_id",
        as: "destinationNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // nodeBatch ↔ nodeStockLedger
    NodeBatch.hasMany(NodeStockLedger, {
        foreignKey: "source_batch_id",
        as: "batchTransactions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(NodeBatch, {
        foreignKey: "source_batch_id",
        as: "sourceBatch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // brand <-> requisitionItem
    /*Brand.hasMany(RequisitionItem, {
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
    });*/

    // category <-> requisitionItem
    /*Category.hasMany(RequisitionItem, {
        foreignKey: "category_id",
        as: "categoryRequisitionItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    RequisitionItem.belongsTo(Category, {
        foreignKey: "category_id",
        as: "category",
        onDelete: "CASCADE",
        onUp*ate: "CASCADE",
    });*/

    // requisitionItem -> category
    /*RequisitionItem.belongsTo(Category, {
        foreignKey: "sub_category_id",
        as: "subCategory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });*/


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
        User,
        UserRoles,
        NodeBatch,
        RequisitionItem,
        Requisition,
        HSN,
        Quotation,
        QuotationItem,
        PurchasOrder,
        PurchaseOrderItem,
        Invoice,
        InvoiceItems,
        Supplier,
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
        TenantBusinessFlow,
        NodeStockLedger,
        GRN,
        GRNItem,


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
        foreignKey: "hsn_code",
        sourceKey: "hsn_code",
        as: "product", // singular, since it's a hasOne relationship
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.belongsTo(HSN, {
        foreignKey: "hsn_code",
        targetKey: "hsn_code",
        as: "hsn", // or just "hsn" if not already used
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

    // requisitionItem ↔ quotationItem
    RequisitionItem.hasOne(QuotationItem, {
        foreignKey: "requisition_item_id",
        as: "linkedQuotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    QuotationItem.belongsTo(RequisitionItem, {
        foreignKey: "requisition_item_id",
        as: "sourceRequisitionItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisitionItem ↔ purchaseOrderItem
    RequisitionItem.hasOne(PurchaseOrderItem, {
        foreignKey: "requisition_item_id",
        as: "linkedPurchaseOrderItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchaseOrderItem.belongsTo(RequisitionItem, {
        foreignKey: "requisition_item_id",
        as: "poi_sourceRequisitionItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition(PR) <-> quotation
    Requisition.hasOne(Quotation, {
        foreignKey: "requisition_id",
        as: "requisitionQuotation",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Quotation.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "quotationRequisition",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // quotation <-> purchasOrder
    Quotation.hasOne(PurchasOrder, {
        foreignKey: "quotation_id",
        as: "linkedPurchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "linkedQuotation",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // requisition - purchasOrder
    Requisition.hasOne(PurchasOrder, {
        foreignKey: "requisition_id",
        as: "purchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.belongsTo(Requisition, {
        foreignKey: "requisition_id",
        as: "requisitions",
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

    // quotation ↔ quotationItem
    Quotation.hasMany(QuotationItem, {
        foreignKey: "quotation_id",
        as: "quotationItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    QuotationItem.belongsTo(Quotation, {
        foreignKey: "quotation_id",
        as: "quotationDetails",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });









    /************* PURCHASE ORDER (PO) ********************/
    // purchaseOrderItem(POD) <-> purchasOrder(PO)
    PurchaseOrderItem.belongsTo(PurchasOrder, {
        foreignKey: "purchase_order_id",
        as: "purchasOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(PurchaseOrderItem, {
        foreignKey: "purchase_order_id",
        as: "purchasOrderItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // purchasOrder(PO) <-> user
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

    // purchasOrder - businessNode
    PurchasOrder.belongsTo(BusinessNode, {
        foreignKey: "form_business_node_id",
        as: "poFormBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(PurchasOrder, {
        foreignKey: "form_business_node_id",
        as: "fromPurchaseOrders",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // purchasOrder - businessNode
    PurchasOrder.belongsTo(BusinessNode, {
        foreignKey: "to_business_node_id",
        as: "poToBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(PurchasOrder, {
        foreignKey: "to_business_node_id",
        as: "toPurchaseOrders",
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

    // quotation <-> businessNode
    Quotation.belongsTo(BusinessNode, {
        foreignKey: "from_business_node_id",
        as: "fromBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(Quotation, {
        foreignKey: "from_business_node_id",
        as: "sentQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // quotation <-> businessNode
    Quotation.belongsTo(BusinessNode, {
        foreignKey: "to_business_node_id",
        as: "toBusinessNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(Quotation, {
        foreignKey: "to_business_node_id",
        as: "receivedQuotations",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // quotation <-> User
    Quotation.belongsTo(User, {
        foreignKey: "created_by",
        as: "quotationCreated",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    User.hasMany(Quotation, {
        foreignKey: "created_by",
        as: "createQuotation",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode <-> tenantBusinessFlow
    BusinessNode.belongsTo(TenantBusinessFlow, {
        foreignKey: "tenant_business_flow_id",
        as: "parentFlow",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    TenantBusinessFlow.hasMany(BusinessNode, {
        foreignKey: "tenant_business_flow_id",
        as: "flowNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });


    /** grn */

    // grnItem <-> grn
    GRNItem.belongsTo(GRN, {
        foreignKey: "grn_id",
        as: "grn",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    GRN.hasMany(GRNItem, {
        foreignKey: "grn_id",
        as: "grnLineItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grn <-> purchasOrder
    GRN.belongsTo(PurchasOrder, {
        foreignKey: "purchase_order_id",
        as: "grnPurchaseOrder",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchasOrder.hasMany(GRN, {
        foreignKey: "purchase_order_id",
        as: "grns",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grn <-> businessNode
    GRN.belongsTo(BusinessNode, {
        foreignKey: "from_node_id",
        as: "fromNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(GRN, {
        foreignKey: "from_node_id",
        as: "fromGrns",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grn <-> businessNode
    GRN.belongsTo(BusinessNode, {
        foreignKey: "to_node_id",
        as: "toNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    BusinessNode.hasMany(GRN, {
        foreignKey: "to_node_id",
        as: "toGrns",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });


    // grnItem <-> purchaseOrderItem
    GRNItem.belongsTo(PurchaseOrderItem, {
        foreignKey: "purchase_order_item_id",
        as: "poItem",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    PurchaseOrderItem.hasMany(GRNItem, {
        foreignKey: "purchase_order_item_id",
        as: "grnItems",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // grnItem <-> product
    GRNItem.belongsTo(Product, {
        foreignKey: "product_id",
        as: "grnProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    Product.hasMany(GRNItem, {
        foreignKey: "product_id",
        as: "grnItemsForProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // ********************************************Many-To-One*********************************

    // user <-> requisition
    User.hasMany(Requisition, {
        foreignKey: "created_by",
        as: "requisitionDetails",
    });
    Requisition.belongsTo(User, {
        foreignKey: "created_by",
        as: "createdBy",
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

    // product ↔ nodeBatch
    Product.hasMany(NodeBatch, {
        foreignKey: "product_id",
        as: "batch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeBatch.belongsTo(Product, {
        foreignKey: "product_id",
        as: "product",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode ↔ nodeBatch
    BusinessNode.hasMany(NodeBatch, {
        foreignKey: "business_node_id",
        as: "inventoryBatches",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeBatch.belongsTo(BusinessNode, {
        foreignKey: "business_node_id",
        as: "inventoryNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // product ↔ nodeStockLedger
    Product.hasMany(NodeStockLedger, {
        foreignKey: "product_id",
        as: "stockLedgers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(Product, {
        foreignKey: "product_id",
        as: "linkedProduct",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });


    // businessNode ↔ nodeStockLedger
    BusinessNode.hasMany(NodeStockLedger, {
        foreignKey: "from_node_id",
        as: "formStockLedgers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(BusinessNode, {
        foreignKey: "from_node_id",
        as: "sourceNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // businessNode ↔ nodeStockLedger
    BusinessNode.hasMany(NodeStockLedger, {
        foreignKey: "to_node_id",
        as: "toStockLedgers",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(BusinessNode, {
        foreignKey: "to_node_id",
        as: "destinationNode",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // nodeBatch ↔ nodeStockLedger
    NodeBatch.hasMany(NodeStockLedger, {
        foreignKey: "source_batch_id",
        as: "batchTransactions",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });
    NodeStockLedger.belongsTo(NodeBatch, {
        foreignKey: "source_batch_id",
        as: "sourceBatch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    });

    // brand <-> requisitionItem
    /*Brand.hasMany(RequisitionItem, {
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
    });*/

    // category <-> requisitionItem
    /*Category.hasMany(RequisitionItem, {
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
    });*/

    // requisitionItem -> category
    /*RequisitionItem.belongsTo(Category, {
        foreignKey: "sub_category_id",
        as: "subCategory",
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });*/

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

export { defineRootAssociations, defineTenantAssociations };
