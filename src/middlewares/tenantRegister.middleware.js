import { deleteTenantDatabase, generateDatabase, getTenantConnection, rootDB } from "../db/tenantMenager.service.js";


const businessNodeSequence = [
    { node_type_code: "L-102", sequence: 1 },
    { node_type_code: "L-103", sequence: 2 },
    { node_type_code: "L-104", sequence: 3 },
    { node_type_code: "L-105", sequence: 4 },
    { node_type_code: "L-110", sequence: 5 },
    { node_type_code: "L-111", sequence: 6 }
];

export const registerNewTenant = (async function (req, res, next) {
    const { rootSequelize, models: rootModels } = await rootDB();
    const { Tenant, TenantsName, TenantBusinessFlowMaster } = rootModels;
    const r_Transaction = await rootSequelize.transaction();

    let t_Transaction = null;
    let dbName = "";
    try {
        const { email } = req.body;
        if (!email) {
            await r_Transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "email must required!!!" });
        }

        dbName = `tenant_${email.split('@')[0].toLowerCase()}`;
        const tenant = await TenantsName.findOne({ where: { tenant: dbName } });
        if (tenant) {
            await r_Transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `email: ${email} is already registered!!!`, tenant_id: dbName });
        }

        const tenantsName = await TenantsName.create({ tenant: dbName }, { transaction: r_Transaction });
        await Tenant.create({ tenant_id: tenantsName.id, email, isOwner: true }, { transaction: r_Transaction });
        await TenantBusinessFlowMaster.bulkCreate(
            businessNodeSequence.map(item => ({
                ...item,
                tenant_id: tenantsName.id
            })), { transaction: r_Transaction }
        );

        await generateDatabase(dbName);
        const { sequelize, models } = await getTenantConnection(dbName);
        const { TenantBusinessFlow } = models;
        t_Transaction = await sequelize.transaction();

        await TenantBusinessFlow.bulkCreate(businessNodeSequence, { transaction: t_Transaction });

        req.headers["x-tenant-id"] = dbName;
        req.dbObject = sequelize;
        req.dbModels = models;
        req.rootModels = rootModels;
        req.transaction = { t_Transaction, r_Transaction };

        return next();

    } catch (error) {
        if(t_Transaction) await t_Transaction.rollback();
        await r_Transaction.rollback();

        await deleteTenantDatabase(dbName);
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});