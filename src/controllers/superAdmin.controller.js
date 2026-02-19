import { Op } from "sequelize";
import { deleteTenantDatabase, generateDatabase, getTenantConnection, rootDB } from "../db/tenantMenager.service.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { deleteImage } from "../utils/handelImage.js";


// GET
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


const tenantBusinessFlow = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName, TenantBusinessFlowMaster } = req.dbModels;
    try {
        const { email = "" } = req.query;
        if (!email) throw new Error("Email required!!!");

        const result = await Tenant.findOne({
            where: { email },
            include: [
                {
                    model: TenantsName,
                    as: "tenantsName",
                    include: [
                        {
                            model: TenantBusinessFlowMaster,
                            as: "businessFlows",
                            where: { is_active: true },
                            separate: true,
                            order: [["sequence", "ASC"]],
                        },
                    ],
                },
            ],
        });


        const formatedResult = result.toJSON();
        formatedResult.businessFlows = result.tenantsName.businessFlows;
        delete formatedResult.tenantsName.businessFlows;

        return res.status(200).json({ success: true, code: 200, data: formatedResult });

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


        const tenant = await Tenant.findAndCountAll({
            where: {
                isOwner: true,
                password: { [Op.ne]: null },
                ...(email && { email }),
                ...(id && { id: Number(id) }),
            },
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
            data: tenant.rows,
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



// POST

/** ==>> not in use anymore  */
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


const registerBusinessNode = asyncHandler(async (req, res) => {
    const { BusinessNode, NodeDetails, TenantBusinessFlow } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const dbName = req.headers["x-tenant-id"];
    const profile_image = req?.file?.filename || null;
    try {
        let { full_name = "", location = "", address = "", state = "", district = "", pincode = "", node = "", gst_no = "", license_no = "", lat = "", long = "", desc = "" } = req.body;

        if ([full_name, location, address, state, district, pincode, node].some(item => item === "")) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields missing!!!" });
        }
        node = JSON.parse(node);
        state = JSON.parse(state);
        district = JSON.parse(district);

        const tenantBusinessFlow = await TenantBusinessFlow.findOne({ where: { node_type_code: node.code }, transaction });
        if (!tenantBusinessFlow) {
            throw new Error("Invalid business node type code!!!");
        };

        /** create business node */
        const businessNode = await BusinessNode.create({
            name: `${node.name} - ${location}`,
            node_type_code: node.code,
            tenant_business_flow_id: tenantBusinessFlow.id,
        }, { transaction });

        /**create node details */
        const nodeDetails = await NodeDetails.create({
            name: full_name,
            business_node_id: businessNode.id,
            location,
            address: {
                address,
                state: state.name,
                district: district.name,
                pincode,
                ...((lat && long) ? { lat, long } : {})
            },
            gst_no,
            license_no,
            ...(profile_image && { image: `${dbName}/${profile_image}` }),
            desc
        }, { transaction });
        if (!nodeDetails) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        await transaction.rollback();
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

// UPDATE
const updateTenantBusinessFlow = asyncHandler(async (req, res) => {
    const { Tenant, TenantsName, TenantBusinessFlowMaster } = req.dbModels;
    const rootTransaction = await req.dbObject.transaction();

    let tenantTransaction = null;
    try {
        const { email, nodeSequence = [] } = req.body;
        if (!email || nodeSequence.length < 1) {
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "email and nodeSequence must required!!!" });
        }

        const result = await Tenant.findOne({
            where: { email },
            include: [
                {
                    model: TenantsName,
                    as: "tenantsName"
                },
            ],
        }, { transaction: rootTransaction });
        if (!result) throw new Error("Record Not Found!!!");

        const tenantId = result?.tenant_id;
        const tenantDB = result?.tenantsName?.tenant;

        /** prepare data sequence data */
        const businessNodeSequence = nodeSequence.map((item, index) => ({
            node_type_code: item.code,
            sequence: index + 1
        }));

        /** update main DB */
        await TenantBusinessFlowMaster.update(
            { is_active: false },
            { where: { tenant_id: tenantId }, transaction: rootTransaction }
        );

        await TenantBusinessFlowMaster.bulkCreate(
            businessNodeSequence.map(item => ({
                ...item,
                tenant_id: tenantId,
                is_active: true,
            })),
            {
                updateOnDuplicate: ["sequence", "is_active", "updatedAt"],
                transaction: rootTransaction,
            }
        );


        const { sequelize, models } = await getTenantConnection(tenantDB);
        const { TenantBusinessFlow } = models;
        tenantTransaction = await sequelize.transaction();


        /** update tenant DB */
        await TenantBusinessFlow.update(
            { is_active: false },
            { where: {}, transaction: tenantTransaction }
        );

        await TenantBusinessFlow.bulkCreate(
            businessNodeSequence.map(item => ({
                ...item,
                is_active: true,
            })),
            {
                updateOnDuplicate: ["sequence", "is_active", "updatedAt"],
                transaction: tenantTransaction,
            }
        );

        await tenantTransaction.commit();
        await rootTransaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Tenant Business Flow Updated" });

    } catch (error) {
        if (tenantTransaction) await tenantTransaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// DELETE
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

export { allBusinessNodes, tenantBusinessFlow, registerNewTenant, registerBusinessNode, delete_company, all_company, updateCompanyDetails, updateTenantBusinessFlow };