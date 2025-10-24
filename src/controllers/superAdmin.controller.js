import { Op } from "sequelize";
import { deleteTenantDatabase, generateDatabase } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import bcrypt from "bcrypt";

const all_company = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName } = req.dbModels;
    try {
        let { page = 1, limit = 10, email = "", id = "" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        const offset = (page - 1) * limit;

        let condition = {};
        if (email) condition.email = email;
        if (id) condition.id = id;

        const tenant = await Tenant.findAndCountAll({
            where: { isOwner: true, password: { [Op.ne]: null }, ...condition },
            include: [
                {
                    model: TenantsName,
                    as: "tenantsName"
                }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        if (!tenant) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = tenant.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: tenant,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit,
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const register = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName } = req.dbModels;
    const transaction = await req.dbObject.transaction();
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, code: 400, message: "email must required!!!" });

        const dbName = `tenant_${email.split('@')[0].toLowerCase()}`;
        const tenant = await TenantsName.findOne({ where: { tenant: dbName } });
        if (tenant) {
            return res.status(409).json({ success: false, code: 409, message: `email: ${email} is already registered!!!`, tenant_id: dbName });
        }

        const tenantsName = await TenantsName.create({ tenant: dbName }, { transaction });
        await Tenant.create({ tenant_id: tenantsName.id, email, isOwner: true }, { transaction });
        await generateDatabase(dbName);

        await transaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "New Tenant is created successfully.", tenant_id: dbName });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const delete_company = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName, User } = req.dbModels;

    try {
        const { adminPassword = "", ownerMail = "" } = req.body;
        if (!adminPassword || !ownerMail) return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        const userDetails = req.user;

        const user = await User.findByPk(userDetails.id);
        if (!user) return res.status(400).json({ success: false, code: 400, message: "Something wrong! Current user not found!!!" });

        const isMatched = await bcrypt.compare(adminPassword, user.password);
        if (!isMatched) return res.status(400).json({ success: false, code: 400, message: "Wrong password!!!" });

        const tenant = await Tenant.findOne({
            where: { email: ownerMail },
            attribute: [],
            include: [
                {
                    model: TenantsName,
                    as: "tenantsName",
                    attribute: ["tenant"]
                }
            ]
        });
        const tenantDb = tenant.tenantsName.tenant;
        await deleteTenantDatabase(tenantDb);

        return res.status(200).json({ success: true, code: 200, message: "Company deleted successfully" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export { register, delete_company, all_company };