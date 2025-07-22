import User from "./user.model.js";
import Role from "./role.model.js";
import Permission from "./permission.model.js";

import UserRoles from "./UserRoles.joinModel.js";
import RolePermissions from "./rolePermissions.joinModel.js";




// *****************************One-To-One*****************************




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