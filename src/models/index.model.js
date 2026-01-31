import Category from "./category.model.js";
import Tenant from "./main/tenant.model.js"
import District from "./main/district.model.js";
import Permission from "./permission.model.js";
import Product from "./product.model.js";
import Role from "./role.model.js";
import RolePermissions from "./rolePermissions.joinModel.js";
import State from "./main/state.model.js";
import Inward from "./inward.model.js";
import InwardItem from "./inwardItem.model.js";
import User from "./user.model.js";
import UserRoles from "./userRoles.joinModel.js";
import Batch from "./batch.model.js";
import TenantsName from "./main/tenantsName.model.js";
import Requisition from "./requisition.model.js";
import RequisitionItem from "./requisitionItem.model.js";
import HSN from "./hsn_master.model.js";
import Quotation from "./quotation.model.js";
import QuotationItems from "./quotationItems.model.js";
import PurchasOrder from "./purchasOrder.model.js";
import PurchaseOrderItems from "./purchaseOrderItems.model.js";
import Invoice from "./invoice.model.js";
import InvoiceItems from "./invoiceItems.model.js";
import Supplier from "./supplier.model.js";
import Inventory from "./inventory.model.js";
import Outward from "./outward.model.js";
import OutwardItems from "./outwardItems.model.js";
import BillOfMaterial from "./billOfMaterial.model.js";
import Brand from "./brand.model.js";
import UnitType from "./unitType.model.js";
import SupplierBrand from "./supplierBrand.joinModel.js";
import CategoryProducts from "./categoryProduct.joinModel.js";
import BrandProducts from "./brandProduct.joinModel.js";
import TenantBusinessFlowMaster from "./main/tenantBusinessFlowMaster.model.js";
import TenantBusinessFlow from "./businessModels/tenantBusinessFlow.model.js";
import BusinessNode from "./businessModels/businessNode.model.js";
import PackageType from "./packageType.model.js";
import NodeUser from "./nodeUsers.join_Model.js";
import NodeDetails from "./businessModels/nodeDetails.model.js";
import BusinessNodeType from "./businessModels/businessNodeType.model.js";
import RequisitionSupplier from "./requisitionSupplier.joinModel.js";

const defineRootModels = (rootSequelize) => {
    Tenant(rootSequelize);
    User(rootSequelize);
    Inward(rootSequelize);
    Category(rootSequelize);
    District(rootSequelize);
    State(rootSequelize);
    Permission(rootSequelize);
    Role(rootSequelize);
    RolePermissions(rootSequelize);
    Product(rootSequelize);
    InwardItem(rootSequelize);
    UserRoles(rootSequelize);
    Batch(rootSequelize);
    TenantsName(rootSequelize);
    Requisition(rootSequelize)
    RequisitionItem(rootSequelize)
    HSN(rootSequelize);
    Quotation(rootSequelize);
    QuotationItems(rootSequelize);
    PurchasOrder(rootSequelize);
    PurchaseOrderItems(rootSequelize);
    Invoice(rootSequelize);
    InvoiceItems(rootSequelize);
    Inventory(rootSequelize);
    Outward(rootSequelize);
    OutwardItems(rootSequelize);
    BillOfMaterial(rootSequelize);
    Brand(rootSequelize);
    UnitType(rootSequelize);
    Supplier(rootSequelize);
    SupplierBrand(rootSequelize);
    CategoryProducts(rootSequelize);
    BrandProducts(rootSequelize);
    BusinessNodeType(rootSequelize);
    TenantBusinessFlowMaster(rootSequelize);
    TenantBusinessFlow(rootSequelize);
    BusinessNode(rootSequelize);
    PackageType(rootSequelize);
    NodeUser(rootSequelize);
    NodeDetails(rootSequelize);
    RequisitionSupplier(rootSequelize);
    
    return rootSequelize.models;
}

const defineTenantModels = (sequelize) => {
    Category(sequelize);
    Permission(sequelize);
    Product(sequelize);
    Role(sequelize);
    RolePermissions(sequelize);
    Inward(sequelize);
    InwardItem(sequelize);
    User(sequelize);
    UserRoles(sequelize);
    Batch(sequelize);
    Requisition(sequelize),
    RequisitionItem(sequelize)
    HSN(sequelize);
    Quotation(sequelize);
    QuotationItems(sequelize);
    PurchasOrder(sequelize);    
    PurchaseOrderItems(sequelize);
    Invoice(sequelize);
    InvoiceItems(sequelize);
    Inventory(sequelize);
    Outward(sequelize);
    OutwardItems(sequelize);
    BillOfMaterial(sequelize);
    Brand(sequelize);
    UnitType(sequelize);
    Supplier(sequelize);
    SupplierBrand(sequelize);
    CategoryProducts(sequelize);
    BrandProducts(sequelize);
    BusinessNodeType(sequelize);
    TenantBusinessFlow(sequelize);
    BusinessNode(sequelize);
    PackageType(sequelize);
    NodeUser(sequelize);
    NodeDetails(sequelize);
    RequisitionSupplier(sequelize);
    
    return sequelize.models;
}

export { defineTenantModels, defineRootModels };