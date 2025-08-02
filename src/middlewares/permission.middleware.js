import { asyncHandler } from "../utils/asyncHandler.js";
import RolePermissions from "../models/rolePermissions.joinModel.js";
import Permission from "../models/permission.model.js";

const verifyPermission = (purpose) => {
    return asyncHandler(async (req, res, next) => {

        if(req.session.user.role.role === "superAdmin") return next();

        const mappings = await RolePermissions.findAll({ where: { roleId: req.session.user.role.id } });

        const permissionIds = mappings.map(m => m.permissionId);

        const permissions = await Permission.findAll({ where: { id: permissionIds } });

        const permissionString = permissions.map(p => p.permission);

        if (!permissionString.includes(purpose)) {

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied!"
                });
            }

            // return res.status(403).json({ success: false, message: "Access denied!" });
            return res.status(403).render("403");
        }
        next();
    });
};

export { verifyPermission }