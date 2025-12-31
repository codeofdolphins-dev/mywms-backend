import Category from "./category.model.js";
import Tenant from "./main/tenant.model.js"
import District from "./main/district.model.js";
import Driver from "./main/driver.model.js";
import Permission from "./permission.model.js";
import Product from "./product.model.js";
import Role from "./role.model.js";
import RolePermissions from "./rolePermissions.joinModel.js";
import State from "./main/state.model.js";
import Inward from "./inward.model.js";
import InwardItem from "./inwardItem.model.js";
import User from "./user.model.js";
import UserRoles from "./userRoles.joinModel.js";
import Vehicle from "./main/vehicle.model.js";
import Warehouse from "./warehouse.model.js";
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
import SupplierBankDetails from "./supplierBankDetails.model.js";
import Inventory from "./inventory.model.js";
import Outward from "./outward.model.js";
import OutwardItems from "./outwardItems.model.js";
import BillOfMaterial from "./billOfMaterial.model.js";
import Brand from "./brand.model.js";
import Unit from "./unit.model.js";
import UserType from "./userType.model.js";
import WarehouseType from "./warehouseTypes.model.js";
import RequisitionRule from "./requisitionRule.model.js";
import SupplierBrand from "./supplierBrand.joinModel.js";
import CategoryProducts from "./categoryProduct.joinModel.js";
import BrandProducts from "./brandProduct.joinModel.js";

const defineRootModels = (rootSequelize) => {
    Tenant(rootSequelize);
    User(rootSequelize);
    Inward(rootSequelize);
    Category(rootSequelize);
    District(rootSequelize);
    State(rootSequelize);
    Driver(rootSequelize);
    Permission(rootSequelize);
    Role(rootSequelize);
    RolePermissions(rootSequelize);
    Product(rootSequelize);
    InwardItem(rootSequelize);
    UserRoles(rootSequelize);
    Vehicle(rootSequelize);
    Warehouse(rootSequelize);
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
    Unit(rootSequelize);
    UserType(rootSequelize);
    RequisitionRule(rootSequelize);
    WarehouseType(rootSequelize);
    SupplierBankDetails(rootSequelize);
    SupplierBrand(rootSequelize);
    CategoryProducts(rootSequelize);
    BrandProducts(rootSequelize);
    
    return rootSequelize.models;
}

const defineTenantModels = (sequelize) => {
    Category(sequelize);
    Driver(sequelize);
    Permission(sequelize);
    Product(sequelize);
    Role(sequelize);
    RolePermissions(sequelize);
    Inward(sequelize);
    InwardItem(sequelize);
    User(sequelize);
    UserRoles(sequelize);
    Vehicle(sequelize);
    Warehouse(sequelize);
    Batch(sequelize);
    Requisition(sequelize),
    RequisitionItem(sequelize)
    HSN(sequelize);
    Quotation(sequelize);
    QuotationItems(sequelize);
    Vendor(sequelize);
    PurchasOrder(sequelize);    
    PurchaseOrderItems(sequelize);
    Invoice(sequelize);
    InvoiceItems(sequelize);
    Inventory(sequelize);
    Outward(sequelize);
    OutwardItems(sequelize);
    BillOfMaterial(sequelize);
    Brand(sequelize);
    Unit(sequelize);
    WarehouseType(sequelize);
    UserType(sequelize);
    SupplierBankDetails(sequelize);
    RequisitionRule(sequelize);
    SupplierBrand(sequelize);
    CategoryProducts(sequelize);
    BrandProducts(sequelize);
    
    return sequelize.models;
}

export { defineTenantModels, defineRootModels };