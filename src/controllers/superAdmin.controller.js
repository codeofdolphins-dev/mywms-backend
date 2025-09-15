import { generateDatabase } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js"

const register = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName } = req.dbModels;
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, code: 400, message: "email must required!!!" });

        const dbName = `tenant_${email.split('@')[0].toLowerCase()}`;
        const tenant = await TenantsName.findOne({ where: { tenant: dbName } });        
        if (tenant) {
            return res.status(400).json({ success: false, code: 400, message: `email: ${email} is already registered!!!`, tenant_id: dbName });
        }

        const tenantsName = await TenantsName.create({ tenant: dbName });
        await Tenant.create({ tenant_id: tenantsName.id, email });
        await generateDatabase(dbName);

        return res.status(200).json({ success: true, code: 200, message: "New Tenant is created successfully.", tenant_id: dbName });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const delete_company = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName } = req.dbModels;

    try {
        
        

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const all_company = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName } = req.dbModels;

    try {
        
        

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { register };