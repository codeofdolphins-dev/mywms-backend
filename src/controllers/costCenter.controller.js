import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateNo } from "../helper/generate.js";
import { getUserContext } from "../utils/getUserContext.js";
import { deleteFile } from "../utils/handelImage.js";


// GET
export const costList = asyncHandler(async (req, res) => {
    const { CostCenter, CostCategory, User, BusinessNode } = req.dbModels;
    const activeNodeId = req.activeNode;
    try {
        let { page = 1, limit = 10, id = null, search = null, type = "", noLimit = false, isAdmin = false } = req.query;
        page = parseInt(page, 10);
        limit = parseInt(limit, 10);
        const offset = (page - 1) * limit;

        const whereClause = {
            ...(!isAdmin && { location_id: activeNodeId })
        };

        if (id) {
            whereClause.id = Number(id);
        }
        if (search) {
            const searchTerm = `%${search.trim()}%`;
            whereClause[Op.or] = [
                { cost_no: { [Op.iLike]: searchTerm } },
                { "$costHead.name$": { [Op.iLike]: searchTerm } },
                { "$costSubHead.name$": { [Op.iLike]: searchTerm } }
            ];
        }
        if (type) {
            whereClause.type = type.trim().toLowerCase();
        }

        const costCenterData = await CostCenter.findAndCountAll({
            distinct: true,
            where: whereClause,
            include: [
                {
                    model: CostCategory,
                    as: 'costHead',
                },
                {
                    model: CostCategory,
                    as: 'costSubHead',
                },
                {
                    model: User,
                    as: 'costCreator',
                    attributes: ['id', 'email', 'name']
                },
                {
                    model: BusinessNode,
                    as: 'costCenterLocation',
                }
            ],
            ...(noLimit ? {} : { limit, offset }),
            order: [['createdAt', 'ASC']]
        });
        if (!costCenterData) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = costCenterData.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: costCenterData.rows,
            ...(noLimit
                ? {}
                : {
                    pagination: {
                        totalItems,
                        totalPages,
                        currentPage: page,
                        limit
                    }
                }
            ),
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


// POST
export const createCost = asyncHandler(async (req, res) => {
    const { CostCenter, CostCategory } = req.dbModels;
    const user = await getUserContext(req);
    const folder = req.headers['x-tenant-id'];

    try {
        const { costHead_id = "", costSubHead_id = "", type = "", amount = "", cost_date = "", remarks = "" } = req.body;
        if (!costHead_id || !amount) {
            if (req?.isfileSave) await deleteFile(req?.file?.filename);
            return res.status(400).json({ success: false, code: 400, message: "costHead_id and amount required!!!" });
        }

        const isExistsHead = await CostCategory.findByPk(Number(costHead_id));
        if (!isExistsHead) {
            if (req?.isfileSave) await deleteFile(req?.file?.filename);
            return res.status(404).json({ success: false, code: 404, message: `Cost Head not found!!!` });
        }

        if (costSubHead_id) {
            const isExists = await CostCategory.findByPk(Number(costSubHead_id));
            if (!isExists) {
                if (req?.isfileSave) await deleteFile(req?.file?.filename);
                return res.status(404).json({ success: false, code: 404, message: `Cost Sub Head not found!!!` });
            }
        };

        const costCenter = await CostCenter.create({
            costHead_id: Number(costHead_id),
            ...(costSubHead_id && { costSubHead_id: Number(costSubHead_id) }),
            type: type.trim().toLowerCase(),
            amount: Number(amount),
            cost_date: cost_date ? new Date(cost_date) : new Date(),
            ...(remarks && { remarks: remarks.trim() }),
            location_id: Number(user?.activeNode?.id),
            ...(user?.activeNode?.store !== undefined && { store_id: Number(user.activeNode.store.id) }),
            ...(req?.isfileSave && { doc_url: `${folder}/${req?.file?.filename}` }),
            creator_id: Number(user?.id)
        });
        if (!costCenter) {
            if (req?.isfileSave) await deleteFile(req?.file?.filename);
            return res.status(500).json({ success: false, code: 500, message: "Insertion failed!!!" });
        }

        costCenter.cost_no = generateNo("COST", costCenter.id);
        await costCenter.save();

        return res.status(200).json({ success: true, code: 200, message: "Cost added successfully." });

    } catch (error) {
        console.log(error);
        if (req?.isfileSave) await deleteFile(req?.file?.filename);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// UPDATE
export const updateCost = asyncHandler(async (req, res) => {
    const { CostCenter, CostCategory } = req.dbModels;
    const folder = req.headers['x-tenant-id'];


    try {
        const { id, costHead_id, costSubHead_id, type, amount, cost_date, remarks } = req.body;
        if (!id) {
            if (req?.isfileSave) await deleteFile(req?.file?.filename);
            return res.status(400).json({ success: false, code: 400, message: "Id is required." });
        }

        const costCenter = await CostCenter.findByPk(Number(id));
        if (!costCenter) {
            if (req?.isfileSave) await deleteFile(req?.file?.filename);
            return res.status(404).json({ success: false, code: 404, message: "Cost record not found!!!" });
        }

        let updateDetails = {};
        if (costHead_id) {
            const isExistsHead = await CostCategory.findByPk(Number(costHead_id));
            if (!isExistsHead) {
                if (req?.isfileSave) await deleteFile(req?.file?.filename);
                return res.status(404).json({ success: false, code: 404, message: `Cost Head not found!!!` });
            }
            updateDetails.costHead_id = Number(costHead_id);
        }
        if (costSubHead_id) {
            const isExists = await CostCategory.findByPk(Number(costSubHead_id));
            if (!isExists) {
                if (req?.isfileSave) await deleteFile(req?.file?.filename);
                return res.status(404).json({ success: false, code: 404, message: `Cost Sub-head not found!!!` });
            }
            updateDetails.costSubHead_id = Number(costSubHead_id);
        } else if (costSubHead_id === null || costSubHead_id === 0) {
            updateDetails.costSubHead_id = null;
        }

        if (type) updateDetails.type = type.trim().toLowerCase();
        if (amount !== undefined) updateDetails.amount = Number(amount);
        if (cost_date) updateDetails.cost_date = new Date(cost_date);
        if (remarks !== undefined) updateDetails.remarks = remarks ? remarks.trim() : null;
        if (req?.isfileSave) {
            if (costCenter.doc_url) await deleteFile(costCenter.doc_url);
            updateDetails.doc_url = `${folder}/${req?.file?.filename}`;
        }

        const isUpdate = await costCenter.update(updateDetails);
        if (!isUpdate) {
            if (req?.isfileSave) await deleteFile(req?.file?.filename);
            return res.status(400).json({ success: false, code: 400, message: "Updation failed!!!" });
        }

        return res.status(200).json({ success: true, code: 200, message: "Updated Successfully." });

    } catch (error) {
        console.log(error);
        if (req?.isfileSave) await deleteFile(req?.file?.filename);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// DELETE
export const deleteCost = asyncHandler(async (req, res) => {
    const { CostCenter } = req.dbModels;
    const activeNodeId = req.activeNode;
    try {
        const { id } = req.params;

        const isExists = await CostCenter.findOne({
            where: {
                id: Number(id),
                // location_id: activeNodeId
            }
        });
        if (!isExists) return res.status(404).json({ success: false, code: 404, message: "Record not found!!!" });

        const isDeleted = await CostCenter.destroy({
            where: {
                id: Number(id),
                // location_id: activeNodeId
            }
        });
        if (!isDeleted) return res.status(400).json({ success: false, code: 400, message: "Deletion failed!!!" });

        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});