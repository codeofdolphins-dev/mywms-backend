import Category from "./category.model.js";
import Tenant from "./main/tenant.model.js"
import District from "./main/district.model.js";
import Permission from "./permission.model.js";
import Product from "./product.model.js";
import Role from "./role.model.js";
import RolePermissions from "./rolePermissions.joinModel.js";
import State from "./main/state.model.js";
import User from "./user.model.js";
import UserRoles from "./userRoles.joinModel.js";
import NodeBatch from "./nodeBatch.model.js";
import TenantsName from "./main/tenantsName.model.js";
import Requisition from "./requisition.model.js";
import RequisitionItem from "./requisitionItem.model.js";
import HSN from "./hsn_master.model.js";
import Quotation from "./quotation.model.js";
import QuotationItem from "./quotationItem.model.js";
import PurchasOrder from "./purchasOrder.model.js";
import PurchaseOrderItem from "./purchaseOrderItem.model.js";
import Invoice from "./invoice.model.js";
import InvoiceItems from "./invoiceItems.model.js";
import Supplier from "./supplier.model.js";
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
    Category(rootSequelize);
    District(rootSequelize);
    State(rootSequelize);
    Permission(rootSequelize);
    Role(rootSequelize);
    RolePermissions(rootSequelize);
    Product(rootSequelize);
    UserRoles(rootSequelize);
    NodeBatch(rootSequelize);
    TenantsName(rootSequelize);
    Requisition(rootSequelize)
    RequisitionItem(rootSequelize)
    HSN(rootSequelize);
    Quotation(rootSequelize);
    QuotationItem(rootSequelize);
    PurchasOrder(rootSequelize);
    PurchaseOrderItem(rootSequelize);
    Invoice(rootSequelize);
    InvoiceItems(rootSequelize);
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
    User(sequelize);
    UserRoles(sequelize);
    NodeBatch(sequelize);
    Requisition(sequelize),
    RequisitionItem(sequelize)
    HSN(sequelize);
    Quotation(sequelize);
    QuotationItem(sequelize);
    PurchasOrder(sequelize);    
    PurchaseOrderItem(sequelize);
    Invoice(sequelize);
    InvoiceItems(sequelize);
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