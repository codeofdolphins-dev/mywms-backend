import { Op } from "sequelize";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getTenantConnection, rootDB } from "../../db/tenantMenager.service.js";
import { generateNo } from "../../helper/generate.js";


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
                { parent_tenant: tenant },
                { child_tenant: tenant }
            ],
            ...(connection_type !== "all" && { connection_type: connection_type.trim().toLowerCase() })
        };

        const { rows, count } = await Connection.findAndCountAll({
            distinct: true,
            where,
            include: [
                {
                    model: TenantsName,
                    as: "parent",
                    include: [{
                        model: Tenant,
                        as: "tenantDetails",
                        where: { isOwner: true },
                        required: false,
                    }]
                },
                {
                    model: TenantsName,
                    as: "child",
                    include: [{
                        model: Tenant,
                        as: "tenantDetails",
                        where: { isOwner: true },
                        required: false,
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


// PUT - update connection type by id (buyer assigns role to a pending/active connection)
export const updateConnectionType = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const rootTransaction = await rootSequelize.transaction();
    const { Connection } = models;

    const tenant = req.headers["x-tenant-id"];

    try {
        const { id } = req.params;
        const { connection_type } = req.body;

        if (!id || !connection_type) {
            return res.status(400).json({ success: false, code: 400, message: "id and connection_type are required" });
        }

        const conn = await Connection.findOne({
            where: {
                id: parseInt(id),
                [Op.or]: [
                    { parent_tenant: tenant },
                    { child_tenant: tenant }
                ]
            }
        });
        if (!conn) return res.status(404).json({ success: false, code: 404, message: "Connection not found" });

        conn.connection_type = connection_type.trim().toLowerCase();
        // If upgrading from pending → set connection_status to active
        if (connection_type !== "pending") {
            conn.connection_status = true;
        }
        await conn.save({ transaction: rootTransaction });
        await rootTransaction.commit();

        return res.status(200).json({ success: true, code: 200, message: "Connection type updated", data: conn });
    } catch (error) {
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

    const child_tenant = req?.headers["x-tenant-id"];

    // console.log(req.body); return
    try {
        const { parent_tenant, connection_type } = req.body;
        if (!parent_tenant || !connection_type) {
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        if (connection_type !== "supplier") throw new Error("Connection type not matching!!!");

        const exist = await Connection.findOne({
            where: {
                parent_tenant,
                child_tenant,
                connection_type,
            }
        });
        if (exist) throw new Error("Record already exist!!!");

        const connection = await Connection.create({
            parent_tenant,
            child_tenant,
            connection_type
        }, { transaction: rootTransaction });

        await rootTransaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Successfully created Supplier connection", data: connection });

    } catch (error) {
        await rootTransaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const createUpdateTraderConnection = asyncHandler(async (req, res) => {
    const { rootSequelize, models } = await rootDB();
    const rootTransaction = await rootSequelize.transaction();
    const { Connection } = models;

    const child_tenant = req?.headers["x-tenant-id"];

    // console.log(req.body); return
    try {
        const { parent_tenant, connection_type } = req.body;
        if (!parent_tenant || !connection_type) {
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        }

        /** ---------------------------------------------------
         *  Check if connection request is already exist and in pending state
         *  --------------------------------------------------- */
        const exist = await Connection.findOne({
            where: {
                parent_tenant,
                child_tenant,
                connection_type: "pending"
            }
        });
        if (exist) {
            exist.connection_type = connection_type.trim().toLowerCase()
            await exist.save({ transaction: rootTransaction })
            await rootTransaction.commit();

            return res.status(200).json({ success: true, code: 200, message: "Connection accepted", data: exist });
        };

        /** ---------------------------------------------------
         *  Check if connection request is already exist (in any state)
         *  --------------------------------------------------- */
        const isExist = await Connection.findOne({
            where: {
                parent_tenant,
                child_tenant
            }
        });
        if (isExist) throw new Error("Record already exist!!!")

        /** ---------------------------------------------------
         *  Create new connection request
         *  --------------------------------------------------- */
        const connection = await Connection.create({
            parent_tenant,
            child_tenant,
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