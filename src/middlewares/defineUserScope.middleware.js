import { rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const defineUserScope = asyncHandler( async (req, res, next) => {    
    try {
        const tenantDB = req.headers["x-tenant-id"];
        if(tenantDB) return next();  
        
        const email = req.body?.email || "";
        if(!email) return res.status(400).json({ success: false, code: 400, message: "User EMAIL must required!!! or Header is not set properly!!!" });

        /**
         * super-admin bypass 
         */
        if(email === process.env.SUPER_ADMIN_EMAIL){
            req.headers["x-tenant-id"] = "mywms";
            req.scope = "root";
            return next();
        }
        
        const { models } = await rootDB();
        
        const tenant = await models.Tenant.findOne({ 
            where: { email }, 
            attributes: [],
            include: [
                {
                    model: models.TenantsName,
                    as: "tenantsName",
                    attributes: ["tenant"]
                },
            ]
        });
        console.log(tenant)
        if(!tenant) return res.status(404).json({ success: false, code: 404, message: `User with email: ${email} is not registered!!!` });

        const dbName = tenant.tenantsName.tenant;
        
        if(dbName === 'mywms'){
            req.headers["x-tenant-id"] = dbName;
            req.scope = "root";
        }else {
            req.headers["x-tenant-id"] = dbName;
            req.scope = "tenant";
        }

        return next();
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});