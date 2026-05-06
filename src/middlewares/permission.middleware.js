import { asyncHandler } from "../utils/asyncHandler.js";

const verifyPermission = (purpose) => {
    return asyncHandler(async (req, res, next) => {

        // if (req?.query?.noLimit == "true") return next();

        // return next();

        const { User, Role, Permission } = req.dbModels;
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

        /** allow owner to skip permission */
        if (user?.is_owner) return next();

        /** allow default roles to skip permission checking */
        for (const role of user?.roles) {
            if (role?.is_default) return next();
        }

        const userPermissions = user.roles.flatMap(role =>
            role.permissions.map(p => p.permission)
        );

        // admin bypass
        if (req.isAdmin) {
            return next();
        }

        // Check if requested permission exists
        if (!userPermissions.includes(purpose)) return res.status(403).json({ success: false, code: 403, message: "Access denied!!!" });

        return next();
    });
};


export { verifyPermission }