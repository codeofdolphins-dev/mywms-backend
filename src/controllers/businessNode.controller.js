import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rootDB } from "../db/tenantMenager.service.js";

// GET
const tenantBusinessNodeList = asyncHandler(async (req, res) => {
    const { BusinessNodeType, TenantBusinessFlow } = req.dbModels;
    try {
        const codes = (await TenantBusinessFlow.findAll({
            attributes: ['node_type_code'],
            raw: true
        })).map(r => r.node_type_code);

        const nodes = await BusinessNodeType.findAll({
            where: { code: { [Op.in]: codes } }
        });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: nodes
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

const allRegisteredNodes = asyncHandler(async (req, res) => {
    const { BusinessNode, BusinessNodeType, NodeDetails } = req.dbModels;
    try {
        const businessNode = await BusinessNode.findAll({
            include: [
                {
                    model: BusinessNodeType,
                    as: "type"
                },
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                },
            ]
        });
        if (!businessNode) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: businessNode
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST
const registeredUserWithNodes = asyncHandler(async (req, res) => {
    const { User, NodeUser } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;
    const dbName = req.headers["x-tenant-id"];

    try {
        const { email = "", password = "", full_name = "", ph_number = "", address = "", state_id = "", district_id = "", pincode = "", company_name = "", node = "", node_type = "" } = req.body;
        const loginUser = req.user;

        if ([email, full_name, ph_number, address, state_id, district_id, pincode].some(item => item === "")) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        const isRegister = await User.findOne({ where: { email } });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image);
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: `User with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: encryptPassword,
            // user_type_id: userType.id,
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
            ...(company_name && { company_name }),
            owner_id: loginUser.id,
            owner_type: loginUser.userType?.type,
        }, { transaction });

        const typeInLower = userType.type.toLowerCase();
        const isWarehouse = typeInLower.includes("warehouse");
        if (isWarehouse) {
            const warehouse = await registerWarehouse(req, user, Warehouse, WarehouseType, userType.type, transaction);
            if (!warehouse) {
                if (profile_image) await deleteImage(profile_image);
                await transaction.rollback();
                return res.status(500).json({ success: false, code: 500, message: "Creation failed!!!" });
            }
        }

        const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } });
        await Tenant.create({
            tenant_id: tenantsName.id,
            email,
            password,
            ...(company_name && { companyName: company_name })
        }, { transaction: rootTransaction });

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { tenantBusinessNodeList, allRegisteredNodes, registeredUserWithNodes }