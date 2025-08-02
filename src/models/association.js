import User from "./user.model.js";
import Role from "./role.model.js";
import Permission from "./permission.model.js";
import Company from "./company.model.js";

import UserRoles from "./UserRoles.joinModel.js";
import CompanyRoles from "./companyRoles.joinModel.js";
import RolePermissions from "./rolePermissions.joinModel.js";
import StockInward from "./stockInward.model.js";
import StockInwardItem from "./stockInwardItem.model.js";
import Vehicle from "./vehicle.model.js";
import Driver from "./driver.model.js";





// ********************************************One-To-Many*********************************

// stockInward.model.js
StockInward.belongsTo(Driver, {
  foreignKey: 'driverId',
  as: 'driver'
});

Driver.hasMany(StockInward, {
  foreignKey: 'driverId',
  as: 'stockInwards'
});

// stockInward.model.js
StockInward.belongsTo(Vehicle, {
  foreignKey: 'vehicleId',
  as: 'vehicle'
});

Vehicle.hasMany(StockInward, {
  foreignKey: 'vehicleId',
  as: 'stockInwards'
});




// ********************************************Many-To-One*********************************

// stockInward.model.js
StockInward.hasMany(StockInwardItem, {
  foreignKey: 'stockInwardId',
  as: 'items'
});

StockInwardItem.belongsTo(StockInward, {
  foreignKey: 'stockInwardId',
  as: 'stockInward'
});


// ********************************************Many-To-Many*********************************
// user - role
User.belongsToMany(Role, {
    through: {
        model: UserRoles,
        unique: false
    },
    foreignKey: 'userId',
    otherKey: 'roleId'
});

Role.belongsToMany(User, {
    through: {
        model: UserRoles,
        unique: false
    },
    foreignKey: 'roleId',
    otherKey: 'userId'
});

// company - role
Company.belongsToMany(Role, {
    through: {
        model: CompanyRoles,
        unique: false
    },
    foreignKey: 'companyId',
    otherKey: 'roleId'
});

Role.belongsToMany(Company, {
    through: {
        model: CompanyRoles,
        unique: false
    },
    foreignKey: 'roleId',
    otherKey: 'companyId'
});

// role - permission
Role.belongsToMany(Permission, {
    through: {
        model: RolePermissions,
        unique: false
    },
    foreignKey: 'roleId',
    otherKey: 'permissionId'
});
Permission.belongsToMany(Role, {
    through: {
        model: RolePermissions,
        unique: false
    },
    foreignKey: 'permissionId',
    otherKey: 'roleId'
});