import Category from "./category.model.js";
import CompanyDetails from "./companyDetails.model.js";
import Tenant from "./main/tenant.model.js"
import District from "./main/district.model.js";
import Driver from "./main/driver.model.js";
import Permission from "./permission.model.js";
import Product from "./product.model.js";
import Role from "./role.model.js";
import RolePermissions from "./rolePermissions.joinModel.js";
import State from "./main/state.model.js";
import StockInward from "./stockInward.model.js";
import User from "./user.model.js";
import UserRoles from "./userRoles.joinModel.js";
import Vehicle from "./main/vehicle.model.js";
import Warehouse from "./warehouse.model.js";
import StockInwardItem from "./stockInwardItem.model.js";
import IndividualDetails from "./individualDetails.model.js";
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
import Vendor from "./vendor.model.js";
import VendorBankDetails from "./vendorBankDetails.model.js";
// import RequestOrder from "./requestOrder.joinModel.js";

const defineRootModels = (rootSequelize) => {
    Tenant(rootSequelize);
    User(rootSequelize);
    StockInward(rootSequelize);
    Category(rootSequelize);
    District(rootSequelize);
    State(rootSequelize);
    Driver(rootSequelize);
    Permission(rootSequelize);
    Role(rootSequelize);
    RolePermissions(rootSequelize);
    Product(rootSequelize);
    CompanyDetails(rootSequelize);
    IndividualDetails(rootSequelize);
    StockInwardItem(rootSequelize);
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
    Vendor(rootSequelize);
    VendorBankDetails(rootSequelize);
    // RequestOrder(rootSequelize);
    
    return rootSequelize.models;
}

const defineTenantModels = (sequelize) => {
    Category(sequelize);
    CompanyDetails(sequelize);
    Driver(sequelize);
    IndividualDetails(sequelize);
    Permission(sequelize);
    Product(sequelize);
    Role(sequelize);
    RolePermissions(sequelize);
    StockInward(sequelize);
    StockInwardItem(sequelize);
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
    // RequestOrder(sequelize);

    PurchaseOrderItems(sequelize);
    Invoice(sequelize);
    InvoiceItems(sequelize);
    VendorBankDetails(sequelize);

    return sequelize.models;
}

export { defineTenantModels, defineRootModels };