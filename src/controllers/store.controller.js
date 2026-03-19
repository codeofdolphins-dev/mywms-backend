import { Op, Sequelize } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeFirstWord } from "../helper/helper.js";


// GET
export const manufacturingUnitCountByType = asyncHandler(async (req, res) => {
    const { ManufacturingUnit } = req.dbModels;

    try {
        const counts = await ManufacturingUnit.findAll({
            attributes: [
                'store_type',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['store_type']
        });

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Counts fetched successfully.",
            data: counts
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

export const manufacturingUnitList = asyncHandler(async (req, res) => {
    const { ManufacturingUnit, BusinessNode, BusinessNodeType } = req.dbModels;

    try {
        let { page = 1, limit = 10, id = "", name = "", store_type = "", noLimit = false, isAdmin = false } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const units = await ManufacturingUnit.findAndCountAll({
            where: {
                ...(id && { id: Number(id) }),
                ...(name && { name: { [Op.iLike]: `%${name}%` } }),
                ...(store_type && { store_type: store_type.toLowerCase() }),
                ...(!isAdmin && { business_node_id: req.user.userBusinessNode.id }),
            },
            include: [
                {
                    model: BusinessNode,
                    as: "parentBusinessNode",
                    include: [
                        {
                            model: BusinessNodeType,
                            as: "type",
                        }
                    ]
                }
            ],
            ...(noLimit === "true" || noLimit === true ? {} : { limit, offset }),
            order: [["createdAt", "ASC"]]
        });
        if (!units) throw new Error("Fetched failed!!!");

        const totalItems = units.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: units.rows,
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



// POST
export const registerManufacturingUnit = asyncHandler(async (req, res) => {
    // console.log(req.body); return
    const { ManufacturingUnit, BusinessNode, BusinessNodeType } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { business_node_id = "", name = "", store_type = "rm_store", location = "", address = "", state = "", district = "", pincode = "", lat = "", long = "" } = req.body;

        if ([business_node_id, name, location].some(item => item === "")) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Required fields are missing!!!" });
        };

        const businessNode = await BusinessNode.findByPk(
            Number(business_node_id), {
            include: [
                {
                    model: BusinessNodeType,
                    as: "type",
                },
            ]
        });
        if (!businessNode) throw new Error("Business Node not found!!!");

        if (businessNode?.type?.category !== "manufacturing") {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "stores are only allow to linked with manufacturing units!!!" });
        };

        const isExists = await ManufacturingUnit.findOne({
            where: {
                name,
                business_node_id: businessNode.id,
                store_type: store_type.toLowerCase()
            }
        });
        if (isExists) {
            await transaction.rollback();
            return res.status(409).json({ success: false, code: 409, message: "Record already exists!!!" });
        };

        const manufacturingUnit = await ManufacturingUnit.create({
            business_node_id: businessNode.id,
            name,
            store_type: store_type.toLowerCase(),
            location,
            address: {
                address,
                state,
                district,
                pincode,
                lat,
                long
            },
        }, { transaction });
        if (!manufacturingUnit) throw new Error("Record not created!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Supplier added successfully." });

    } catch (error) {
        await transaction.rollback();
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



// DELETE
export const deleteManufacturingUnit = asyncHandler(async (req, res) => {
    const { ManufacturingUnit } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id } = req.params;

        const unit = await ManufacturingUnit.findByPk(parseInt(id, 10));
        if (!unit) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: 'Record Not found!!!' });
        }

        const isDelete = await unit.destroy({ transaction });
        if (!isDelete) throw new Error("Deletion Failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Store deleted successfully." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});



// PUT
export const updateManufacturingUnit = asyncHandler(async (req, res) => {
    const { ManufacturingUnit } = req.dbModels;
    const transaction = await req.dbObject.transaction();

    try {
        const { id = "", name, store_type, location, address, state, district, pincode, lat, long, isActive, meta } = req.body;
        if (!id) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 400, message: "Id must required!!!" });
        }

        const unit = await ManufacturingUnit.findByPk(Number(id));
        if (!unit) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 404, message: `Store not found!!!` });
        };

        if (name) unit.name = name;
        if (store_type) unit.store_type = store_type.toLowerCase();
        if (location) unit.location = location;
        if (isActive !== undefined) unit.isActive = isActive;
        if (meta) unit.meta = meta;

        let updatedAddress = { ...unit.address };
        if (address) updatedAddress.address = address;
        if (state) updatedAddress.state = state;
        if (district) updatedAddress.district = district;
        if (pincode) updatedAddress.pincode = pincode;
        if (lat) updatedAddress.lat = lat;
        if (long) updatedAddress.long = long;

        unit.address = updatedAddress;

        const isUpdated = await unit.save({ transaction });
        if (!isUpdated) throw new Error("Updation failed!!!");

        await transaction.commit();
        return res.status(200).json({ success: true, code: 200, message: "Store Details Updated." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});