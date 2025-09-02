import { getTenantConnection, rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const defineDbObject = asyncHandler(async (req, res, next) => {
    try {
        if (req.scope === "root") {
            const { rootSequelize, models } = await rootDB();

            req.dbObject = rootSequelize;
            req.dbModels = models;

            return next();
        };

        const tenantDB = req.headers["x-tenant-id"];
        if (!tenantDB) {
            return res.status(400).json({ success: false, code: 400, error: "Missing x-tenant-id header" });
        };

        if (tenantDB === "mywms") {
            const { rootSequelize, models } = await rootDB();

            req.dbObject = rootSequelize;
            req.dbModels = models;

            return next();
        };

        const { sequelize, models } = await getTenantConnection(tenantDB);

        req.dbObject = sequelize;
        req.dbModels = models;

        return next();

    } catch (error) {
        return res.status(400).json({ success: false, code: 400, message: error.message });
    }
});