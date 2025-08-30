import User from "./user.model.js";
import Role from "./role.model.js";
import Permission from "./global/Permission.model.js";
import CompanyDetails from "./CompanyDetails.model.js";
import IndividualDetails from "./IndividualDetails.model.js";

import UserRoles from "./UserRoles.joinModel.js";
import RolePermissions from "./RolePermissions.joinModel.js";
import StockInward from "./StockInward.model.js";
import StockInwardItem from "./StockInwardItem.model.js";
import Vehicle from "./global/Vehicle.model.js";
import Driver from "./global/Driver.model.js";
import Product from "./Product.model.js";
import District from "./global/District.model.js";
import State from "./global/state.model.js";
import Tenant from "./global/Tenant.model.js";





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

// tenant 1-1 company details
Tenant.hasOne(CompanyDetails, {
    foreignKey: "tenant_id",
    as: "companyDetails"
});
CompanyDetails.belongsTo(Tenant, {
    foreignKey: "tenant_id",
    as: "tenantDetails"
});


// ********************************************One-To-Many*********************************

IndividualDetails.belongsTo(CompanyDetails, {
    foreignKey: "company_id",
    as: "company",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
CompanyDetails.hasMany(IndividualDetails, {
    foreignKey: "company_id",
    as: "employees",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});


// district ↔ IndividualDetails (district has many users)
IndividualDetails.belongsTo(District, {
    foreignKey: "district_id",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});
District.hasMany(IndividualDetails, {
    foreignKey: "district_id",
    as: "district",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});


// state ↔ IndividualDetails (state has many users)
IndividualDetails.belongsTo(State, {
    foreignKey: "state_id",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});
State.hasMany(IndividualDetails, {
    foreignKey: "state_id",
    as: "district",
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

// stockInward.model.js
StockInward.belongsTo(Driver, {
    foreignKey: 'driverId',
    as: 'driver',
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

Driver.hasMany(StockInward, {
    foreignKey: 'driverId',
    as: 'stockInwards',
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

// stockInward.model.js
StockInward.belongsTo(Vehicle, {
    foreignKey: 'vehicleId',
    as: 'vehicle',
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});

Vehicle.hasMany(StockInward, {
    foreignKey: 'vehicleId',
    as: 'stockInwards',
    onDelete: "SET NULL",
    onUpdate: "CASCADE"
});




// ********************************************Many-To-One*********************************

// stockInward - stockInwardItems
StockInward.hasMany(StockInwardItem, {
    foreignKey: 'stockInwardId',
    as: 'items',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
StockInwardItem.belongsTo(StockInward, {
    foreignKey: 'stockInwardId',
    as: 'stockInward',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// Company - Products
CompanyDetails.hasMany(Product, {
    foreignKey: 'company_id',
    as: 'products',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
Product.belongsTo(CompanyDetails, {
    foreignKey: 'company_id',
    as: 'company',
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// company - stosk Inward
CompanyDetails.hasMany(StockInward, {
    foreignKey: "company_id",
    as: "stockInwards",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
StockInward.belongsTo(CompanyDetails, {
    foreignKey: "company_id",
    as: "company",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});

// User - stock inward
User.hasMany(StockInward, {
    foreignKey: "user_id",
    as: "stockInwards",
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
});
StockInward.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
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