import { asyncHandler } from "../utils/asyncHandler.js";
import Permission from "../models/global/Permission.model.js";
import User from "../models/user.model.js";
import Role from "../models/role.model.js";

const verifyPermission = (purpose) => {
    return asyncHandler(async (req, res, next) => {
        const userId = req.user.id;

        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Role,
                    as: "roles",
                    through: { attributes: [] }, // remove UserRoles join output
                    include: [
                        {
                            model: Permission,
                            as: "permissions",
                            through: { attributes: [] } // remove RolePermissions join output
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const userRoles = user.roles.map(r => r.role)        

        const userPermissions = user.roles.flatMap(role =>
            role.permissions.map(p => p.permission)
        );

        // console.log(userPermissions);

        // admin bypass
        if (userRoles.includes("admin")) return next();
        
        // Check if requested permission exists
        if (!userPermissions.includes(purpose)) return res.status(403).json({ success: false, code: 403, message: "Access denied!!!" });

        next();
    });
};


export { verifyPermission }