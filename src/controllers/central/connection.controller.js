import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js";


// GET - list all connections for the current tenant
export const getConnectionList = asyncHandler(async (req, res) => {
    const { models } = await rootDB();
    const { Connection, TenantsName, Tenant } = models;

    const tenant = req.headers["x-tenant-id"];

    try {
        let { page = 1, limit = 20, connection_type = "all" } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const where = {
            [Op.or]: [
                { buyer_tenant: tenant },
                { vendor_tenant: tenant }
            ],
            ...(connection_type !== "all" && { connection_type: connection_type.trim().toLowerCase() })
        };

        const { rows, count } = await Connection.findAndCountAll({
            distinct: true,
            where,
            include: [
                {
                    model: TenantsName,
                    as: "buyer",
                    include: [{
                        model: Tenant,
                        as: "tenantDetails",
                        where: { isOwner: true },
                        required: false,
                        attributes: ["id", "companyName", "email"]
                    }]
                },
                {
                    model: TenantsName,
                    as: "vendor",
                    include: [{
                        model: Tenant,
                        as: "tenantDetails",
                        where: { isOwner: true },
                        required: false,
                        attributes: ["id", "companyName", "email"]
                    }]
                }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        const totalItems = count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched successfully.",
            data: rows,
            pagination: {
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


// PUT - update connection type by id (parent assigns role to a pending/active connection)
export const updateConnectionType = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const rootTransaction = await rootSequelize.transaction();
    const { Connection } = models;

    /** current tenant connection */
    const transaction = await req.dbObject.transaction();

    try {
        const { id } = req.params;
        const { connection_type, buyer_tenant } = req.body;

        if (!id || !connection_type) {
            return res.status(400).json({ success: false, code: 400, message: "id and connection_type are required" });
        }

        const conn = await Connection.findByPk(Number(id));
        if (!conn) return res.status(404).json({ success: false, code: 404, message: "Connection not found" });

        if (!conn.connection_status) {
            await addVendor(req.dbModels, transaction, buyer_tenant, conn);
        }

        conn.connection_type = connection_type.trim().toLowerCase();
        // If upgrading from pending → set connection_status to active
        if (connection_type !== "pending") {
            conn.connection_status = true;
        }
        await conn.save({ transaction: rootTransaction });
        await transaction.commit();
        await rootTransaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Connection type updated", data: conn });
    } catch (error) {
        await transaction.rollback();
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createSupplierConnection = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const rootTransaction = await rootSequelize.transaction();
    const { Connection } = models;

    const tenant = req?.headers["x-tenant-id"];

    // console.log(req.body); return
    try {
        const { parent_tenant, connection_type } = req.body;
        if (!parent_tenant || !connection_type) {
            await rootTransaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        if (connection_type !== "supplier") throw new Error("Connection type not matching!!!");

        const exist = await Connection.findOne({
            where: {
                buyer_tenant: parent_tenant,
                vendor_tenant: tenant,
                connection_type,
            }
        });
        if (exist) throw new Error("Record already exist!!!");

        const connection = await Connection.create({
            buyer_tenant: parent_tenant,
            vendor_tenant: tenant,
            connection_type,
            connection_status: true
        }, { transaction: rootTransaction });

        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Successfully created Supplier connection", data: connection });

    } catch (error) {
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const createTraderConnection = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const rootTransaction = await rootSequelize.transaction();
    const { Connection } = models;

    const tenant = req?.headers["x-tenant-id"];

    // console.log(req.body); return
    try {
        const { vendor_tenant, connection_type } = req.body;
        if (!vendor_tenant || !connection_type) {
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        /** ---------------------------------------------------
         *  Check if connection request is already exist and in pending state
         *  --------------------------------------------------- */
        const exist = await Connection.findOne({
            where: {
                buyer_tenant: tenant,
                vendor_tenant,
                connection_type: "pending"
            }
        });
        if (exist) throw new Error("Record in Pending state!!!")

        /** ---------------------------------------------------
         *  Check if connection request is already exist (in any type)
         *  --------------------------------------------------- */
        const isExist = await Connection.findOne({
            where: {
                buyer_tenant: tenant,
                vendor_tenant,
                connection_status: true
            }
        });
        if (isExist) throw new Error("Record already exist!!!")

        /** ---------------------------------------------------
         *  Create new connection request
         *  --------------------------------------------------- */
        const connection = await Connection.create({
            buyer_tenant: tenant,
            vendor_tenant,
            connection_status: false,
            connection_type: "pending"
        }, { transaction: rootTransaction });

        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Request sent, waiting for approval", data: connection });

    } catch (error) {
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


async function addVendor(model, transaction, tenant, conn) {
    try {
        /* connect tenant and get tenant details */
        const { models: { BusinessNode, NodeDetails, User } } = await getTenantConnection(tenant);
        const tenantDetails = await BusinessNode.findOne({
            where: {
                node_type_code: null,
                tenant_business_flow_id: null
            },
            include: [{ model: NodeDetails, as: "nodeDetails" }]
        });

        const user = await User.findOne({
            where: { is_owner: true },
            attributes: ["id", "phone_no", "email"]
        });


        const vendor = await model.Vendor.create({
            name: tenantDetails.nodeDetails.name,
            tenant: tenant,
            type: "buyer",
            connection_id: conn.id,
            contact_email: user.email,
            contact_phone: user.phone_no,
            address: tenantDetails.nodeDetails.address,
            gst_no: tenantDetails.nodeDetails.gst_no,
            license_no: tenantDetails.nodeDetails.license_no,
        }, { transaction });

        return vendor;
    } catch (error) {
        throw error;
    }
}