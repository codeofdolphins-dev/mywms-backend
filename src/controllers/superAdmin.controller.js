import { Op } from "sequelize";
import { deleteTenantDatabase, generateDatabase, getTenantConnection, rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { deleteImage } from "../utils/handelImage.js";
import { hashPassword } from "../utils/hashPassword.js";


const allBusinessNodes = asyncHandler(async (req, res) => {
    const { BusinessNodeType } = req.dbModels;
    try {
        const businessNodeType = await BusinessNodeType.findAll();
        if (!businessNodeType) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: businessNodeType
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

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

const registerNewTenant = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName, TenantBusinessFlowMaster } = req.dbModels;
    const rootTransaction = await req.dbObject.transaction();

    let tenantTransaction = null;
    try {
        const { email, businessNodeSequence = [] } = req.body;
        if (!email || businessNodeSequence.length < 1) {
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "email must required!!!" });
        }

        const dbName = `tenant_${email.split('@')[0].toLowerCase()}`;
        const tenant = await TenantsName.findOne({ where: { tenant: dbName } });
        if (tenant) {
            await rootTransaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `email: ${email} is already registered!!!`, tenant_id: dbName });
        }

        const tenantsName = await TenantsName.create({ tenant: dbName }, { transaction: rootTransaction });
        await Tenant.create({ tenant_id: tenantsName.id, email, isOwner: true }, { transaction: rootTransaction });
        await TenantBusinessFlowMaster.bulkCreate(
            businessNodeSequence.map(item => ({
                ...item,
                tenant_id: tenantsName.id
            })), { transaction: rootTransaction }
        );

        await generateDatabase(dbName);
        const { sequelize, models } = await getTenantConnection(dbName);
        const { TenantBusinessFlow } = models;
        tenantTransaction = await sequelize.transaction();

        await TenantBusinessFlow.bulkCreate(businessNodeSequence, { transaction: tenantTransaction });

        await tenantTransaction.commit();
        await rootTransaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "New Tenant is created successfully.", tenant_id: dbName });

    } catch (error) {
        if (tenantTransaction) await tenantTransaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const registerBusinessNodeWarehouse = asyncHandler(async (req, res) => {
    const { User, Warehouse, NodeUserOwner, TenantBusinessFlow, Role } = req.dbModels;
    const transaction = await req.dbObject.transaction();


    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();


    const dbName = req.headers["x-tenant-id"];
    const profile_image = req?.file?.filename || null;
    const loginUser = req.user;
    try {
        let { email = "", password = "", full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", node = "", gst_no = "", license_no = "", lat = "", long = "", desc = "" } = req.body;

        if ([email, password, full_name, ph_number, address, state_id, district_id, pincode, node, lat, long].some(item => item === "")) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }
        node = JSON.parse(node);

        const isRegister = await User.findOne({ where: { email }, transaction });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Warehouse with email: ${email} already exists!!!` });
        }

        const isExistsInTenant = await Tenant.findOne({ where: { email }, transaction: rootTransaction });
        if (isExistsInTenant) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `User with email: ${email} is already register in other place first delete from there or contact with Owner/System!!!` });
        }
        const role = await Role.findOne({ where: { role: "node-admin" }, transaction });
        if (!role) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Role "node-admin" not found. Make sure roles are seeded.` });
        };

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: encryptPassword,
            name: { full_name },
            phone_no: ph_number,
            ...(profile_image && { profile_image: `${dbName}/${profile_image}` }),
            address: {
                address,
                state_id,
                district_id,
                pincode
            },
            company_name: loginUser.company_name,
            meta: { desc }
        }, { transaction });

        const warehouse = await Warehouse.create({
            user_id: user.id,
            gst_no,
            license_no,
            lat: parseFloat(lat),
            long: parseFloat(long),
        }, { transaction });

        await user.addRole(role, { transaction });

        const tenantBusinessFlow = await TenantBusinessFlow.findOne({ where: { node_type_code: node.code }, transaction });

        await NodeUserOwner.create({
            user_id: user.id,
            node_id: tenantBusinessFlow.id,
            is_node_owner: true
        }, { transaction })

        const tenantsName = await TenantsName.findOne({ where: { tenant: dbName }, transaction: rootTransaction });
        await Tenant.create({
            tenant_id: tenantsName.id,
            email,
            password,
            companyName: loginUser.company_name,
        }, { transaction: rootTransaction });

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Node Register Successfully." });


    } catch (error) {
        if (tenantTransaction) await tenantTransaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const registerBusinessNodePartner = asyncHandler(async (req, res) => {
    const { User, NodeUserOwner, TenantBusinessFlow, Role } = req.dbModels;
    const transaction = await req.dbObject.transaction();


    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();


    const dbName = req.headers["x-tenant-id"];
    const profile_image = req?.file?.filename || null;
    const loginUser = req.user;

    try {
        let { email = "", password = "", full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", desc = "", node = "" } = req.body;

        if ([email, password, full_name, ph_number, address, state_id, district_id, pincode, node].some(item => item === "")) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }
        node = JSON.parse(node);

        const isRegister = await User.findOne({ where: { email }, transaction });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `User with email: ${email} already exists!!!` });
        }

        const isExistsInTenant = await Tenant.findOne({ where: { email }, transaction: rootTransaction });
        if (isExistsInTenant) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `User with email: ${email} is already register in other place first delete from there or contact with Owner/System!!!` });
        }
        const role = await Role.findOne({ where: { role: "node-admin" }, transaction });
        if (!role) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `Role "node-admin" not found. Make sure roles are seeded.` });
        };

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: encryptPassword,
            name: {
                full_name,
                first_name: full_name.split(" ")[0],
                last_name: full_name.split(" ")?.[1] || '',
            },
            phone_no: ph_number,
            ...(profile_image && { profile_image: `${dbName}/${profile_image}` }),
            address: {
                address,
                state_id,
                district_id,
                pincode
            },
            company_name: loginUser.company_name,
            meta: {
                desc
            }
        }, { transaction });

        await user.addRole(role, { transaction });

        const tenantBusinessFlow = await TenantBusinessFlow.findOne({ where: { node_type_code: node.code }, transaction });

        await NodeUserOwner.create({
            user_id: user.id,
            node_id: tenantBusinessFlow.id,
            is_node_owner: true
        }, { transaction })

        const tenantsName = await TenantsName.findOne({ where: { tenant: dbName }, transaction: rootTransaction });
        await Tenant.create({
            tenant_id: tenantsName.id,
            email,
            password,
            companyName: loginUser.company_name,
        }, { transaction: rootTransaction });

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Node Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image, dbName);
        await transaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const updateCompanyDetails = asyncHandler(async (req, res) => {
    const { User, CompanyDetails } = req.dbModels;
    try {
        const { companyDetails } = req.user || null;

        const { email = "", c_name = "", ph_no = "", status = "" } = req.body;
        const profile_image = req?.file?.filename || null;
        if (!email) return res.status(400).json({ success: false, code: 400, message: "Email must required!!!" });

        const user = await User.findOne({
            where: { email }
        })
        if (!user) return res.status(400).json({ success: false, code: 400, message: `Company with email ${email} not found!!!` });

        let updateDetails = {};
        if (c_name) updateDetails.c_name = c_name;
        if (ph_no) updateDetails.ph_no = ph_no;
        if (status) updateDetails.status = status;

        if (profile_image) {
            const oldImagePath = path.join(
                process.cwd(),
                "public",
                "user",
                companyDetails.profile_image
            );

            // Safely unlink if file exists
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            updateDetails.profile_image = profile_image;
        }

        const isUpdated = await CompanyDetails.update({
            where: { id: userDetails.id },
            updateDetails
        });

        if (!isUpdated) return res.status(500).json({ success: false, code: 500, message: "Updation failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Company details updated successfully" });

    } catch (error) {
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

export { allBusinessNodes, registerNewTenant, registerBusinessNodeWarehouse, registerBusinessNodePartner, delete_company, all_company, updateCompanyDetails };