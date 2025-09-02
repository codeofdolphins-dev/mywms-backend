import Category from "./Category.model.js";
import CompanyDetails from "./CompanyDetails.model.js";
import Tenant from "./main/Tenant.model.js"
import District from "./District.model.js";
import Driver from "./Driver.model.js";
import IndividualDetails from "./IndividualDetails.model.js";
import Permission from "./Permission.model.js";
import Product from "./product.model.js";
import Role from "./role.model.js";
import RolePermissions from "./RolePermissions.joinModel.js";
import State from "./State.model.js";
import StockInward from "./stockInward.model.js";
import User from "./user.model.js";
import UserRoles from "./UserRoles.joinModel.js";
import Vehicle from "./Vehicle.model.js";
import Warehouse from "./Warehouse.model.js";
import StockInwardItem from "./stockInwardItem.model.js";

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