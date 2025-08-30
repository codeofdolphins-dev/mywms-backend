import CompanyDetails from "../models/CompanyDetails.model.js";
import Tenant from "../models/global/Tenant.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const DefineTenantSchema = asyncHandler(async (req, res) => {
    try {
        if (req.isSuperAdmin) {
            req.isSuperAdmin = true;

            next();
        };

        const userWithSchema = await User.findByPk(req.user.id,
            {
                include: {
                    model: CompanyDetails,
                    as: 'companyDetails',
                    include: {
                        model: Tenant,
                        as: 'tenantDetails',
                        attributes: ['schemaName'] // only fetch schemaName
                    }
                }
            }
        );

        console.log(userWithSchema);
        req.schemaName = ""

        // next();

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});