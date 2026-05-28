import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET List
export const partnerStoreList = asyncHandler(async (req, res) => {
    const { Store, BusinessNode, BusinessNodeType, NodeDetails } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", store_name = "", node_id = "", noLimit = false, isAdmin = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const stores = await Store.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(store_name && { store_name: { [Op.iLike]: `%${store_name}%` } }),
                ...(!isAdmin && req.user?.userBusinessNode?.id && { node_id: req.user.userBusinessNode.id }),
                ...(node_id && { node_id: Number(node_id) }),
            },
            include: [
                {
                    model: BusinessNode,
                    as: "storeBusinessNode",
                    include: [
                        {
                            model: BusinessNodeType,
                            as: "type",
                        },
                        {
                            model: NodeDetails,
                            as: "nodeDetails",
                        },
                    ]
                }
            ],
            ...(noLimit === "true" || noLimit === true ? {} : { limit, offset }),
            order: [["createdAt", "ASC"]]
        });

        if (!stores) throw new Error("Fetched failed!!!");

        const totalItems = stores.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: stores.rows,
            ...(!(noLimit === "true" || noLimit === true) && {
                meta: {
                    totalItems,
                    totalPages,
                    currentPage: page,
                    limit
                }
            })
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// POST Create
export const registerPartnerStore = asyncHandler(async (req, res) => {
    const { Store, BusinessNode, BusinessNodeType } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { store_name = "", node_id = "", location = "", address = "", state = "", district = "", pincode = "", lat = "", long = "", status } = req.body;

        if (!store_name) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Store name is required!!!" });
        }

        if (node_id) {
            const businessNode = await BusinessNode.findByPk(Number(node_id), {
                include: [
                    {
                        model: BusinessNodeType,
                        as: "type",
                    },
                ]
            });
            if (!businessNode) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Business Node not found!!!" });
            }
        }

        const isExists = await Store.findOne({
            where: {
                store_name,
                ...(node_id ? { node_id: Number(node_id) } : { node_id: null })
            }
        });
        if (isExists) {
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: "Store already exists under this node!!!" });
        }

        const partnerStore = await Store.create({
            store_name,
            node_id: node_id ? Number(node_id) : null,
            location,
            address: {
                address,
                state,
                district,
                pincode,
                lat,
                long
            },
            status: status !== undefined ? status : true
        }, { transaction });

        if (!partnerStore) throw new Error("Record not created!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Partner Store registered successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// PUT Update
export const updatePartnerStore = asyncHandler(async (req, res) => {
    const { Store, BusinessNode } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id = "", store_name, node_id, location, address, state, district, pincode, lat, long, status } = req.body;

        if (!id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id must be required!!!" });
        }

        const store = await Store.findByPk(Number(id));
        if (!store) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Store not found!!!" });
        }

        if (node_id) {
            const businessNode = await BusinessNode.findByPk(Number(node_id));
            if (!businessNode) {
                await transaction.rollback();
                return res.status(404).json({ success: false, code: 404, message: "Business Node not found!!!" });
            }
        }

        if (store_name) store.store_name = store_name;
        if (node_id !== undefined) store.node_id = node_id ? Number(node_id) : null;
        if (location) store.location = location;
        if (status !== undefined) store.status = status;

        let updatedAddress = { ...store.address };
        if (address !== undefined) updatedAddress.address = address;
        if (state !== undefined) updatedAddress.state = state;
        if (district !== undefined) updatedAddress.district = district;
        if (pincode !== undefined) updatedAddress.pincode = pincode;
        if (lat !== undefined) updatedAddress.lat = lat;
        if (long !== undefined) updatedAddress.long = long;

        store.address = updatedAddress;

        const isUpdated = await store.save({ transaction });
        if (!isUpdated) throw new Error("Update failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Store details updated." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
export const deletePartnerStore = asyncHandler(async (req, res) => {
    const { Store } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id } = req.params;

        const store = await Store.findByPk(parseInt(id, 10));
        if (!store) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: "Store not found!!!" });
        }

        const isDelete = await store.destroy({ transaction });
        if (!isDelete) throw new Error("Deletion failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Store deleted successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});
