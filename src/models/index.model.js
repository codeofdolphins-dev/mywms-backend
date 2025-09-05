import Category from "./category.model.js";
import CompanyDetails from "./companyDetails.model.js";
import Tenant from "./main/Tenant.model.js"
import District from "./district.model.js";
import Driver from "./driver.model.js";
import Permission from "./permission.model.js";
import Product from "./product.model.js";
import Role from "./role.model.js";
import RolePermissions from "./rolePermissions.joinModel.js";
import State from "./state.model.js";
import StockInward from "./stockInward.model.js";
import User from "./user.model.js";
import UserRoles from "./userRoles.joinModel.js";
import Vehicle from "./vehicle.model.js";
import Warehouse from "./warehouse.model.js";
import StockInwardItem from "./stockInwardItem.model.js";
import IndividualDetails from "./IndividualDetails.model.js";

const defineRootModels = (rootSequelize) => {
    Tenant(rootSequelize);
    Category(rootSequelize);
    CompanyDetails(rootSequelize);
    District(rootSequelize);
    Driver(rootSequelize);
    IndividualDetails(rootSequelize);
    Permission(rootSequelize);
    Product(rootSequelize);
    Role(rootSequelize);
    RolePermissions(rootSequelize);
    State(rootSequelize);
    StockInward(rootSequelize);
    StockInwardItem(rootSequelize);
    User(rootSequelize);
    UserRoles(rootSequelize);
    Vehicle(rootSequelize);
    Warehouse(rootSequelize);

    return rootSequelize.models;
}

const defineTenantModels = (sequelize) => {
    Category(sequelize);
    CompanyDetails(sequelize);
    District(sequelize);
    Driver(sequelize);
    IndividualDetails(sequelize);
    Permission(sequelize);
    Product(sequelize);
    Role(sequelize);
    RolePermissions(sequelize);
    State(sequelize);
    StockInward(sequelize);
    StockInwardItem(sequelize);
    User(sequelize);
    UserRoles(sequelize);
    Vehicle(sequelize);
    Warehouse(sequelize);

    return sequelize.models;
}

export { defineTenantModels, defineRootModels };