import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { rootDB } from "../db/tenantMenager.service.js";
import { hashPassword } from "../utils/hashPassword.js";
import { removeFirstWord } from "../helper/removeFirstWord.js"
import { deleteImage } from "../utils/handelImage.js";

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

    // console.log(req.body); 
    // console.log(JSON.parse(req.body.node));

    // return

    const { User, NodeUser } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    const { models, rootSequelize } = await rootDB();
    const { Tenant, TenantsName } = models;
    const rootTransaction = await rootSequelize.transaction();

    const profile_image = req?.file?.filename || null;
    const dbName = req.headers["x-tenant-id"];

    try {
        let { email = "", password = "", full_name = "", phone_no = "", address = "", state = "", district = "", pincode = "", node = "", node_type = "" } = req.body;
        const loginUser = req.user;

        if (
            [email, full_name, phone_no, address, state, district, pincode, password].some(item =>
                item === ""
            )
        ) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "All fields are required!!!" });
        }

        if (node) node = JSON.parse(node);
        if (state) state = JSON.parse(state);
        if (district) district = JSON.parse(district);

        const isRegister = await User.findOne({ where: { email } });
        if (isRegister) {
            if (profile_image) await deleteImage(profile_image, dbName);
            await transaction.rollback();
            await rootTransaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: `User with email: ${email} already exists!!!` });
        }

        const encryptPassword = await hashPassword(password);

        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: encryptPassword,
            name: {
                full_name,
                first_name: full_name.split(" ")[0],
                last_name: removeFirstWord(full_name),
            },
            phone_no,
            ...(profile_image && { profile_image: `${dbName}/${profile_image}` }),
            address: {
                address,
                state: state.name,
                district: district.name,
                pincode
            },
            company_name: loginUser.company_name,
        }, { transaction });


        const tenantsName = await TenantsName.findOne({ where: { tenant: dbName } });
        await Tenant.create({
            tenant_id: tenantsName.id,
            email,
            password,
            company_name: loginUser.company_name
        }, { transaction: rootTransaction });


        /** link user with node if node available */
        if (node) {
            await user.addUserBusinessNode(node.id, {
                through: { userRole: node_type },
                transaction
            });
        }

        await transaction.commit();
        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Register Successfully." });

    } catch (error) {
        if (profile_image) await deleteImage(profile_image, dbName);
        await transaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export { tenantBusinessNodeList, allRegisteredNodes, registeredUserWithNodes }