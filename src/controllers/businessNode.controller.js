import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET
export const tenantBusinessNodeList = asyncHandler(async (req, res) => {
    const { BusinessNodeType, TenantBusinessFlow } = req.dbModels;
    try {
        const codes = (await TenantBusinessFlow.findAll({
            attributes: ['node_type_code'],
            raw: true,
            where: { is_active: true }
        })).map(r => r.node_type_code);

        const nodes = await BusinessNodeType.findAll({
            where: {
                code: { [Op.in]: codes },
                category: { [Op.ne]: "partner" }
            }
        });

        return res.status(200).json({ success: true, code: 200, message: "Fetched Successfully.", data: nodes });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});

// export const allRegisteredNodes = asyncHandler(async (req, res) => {
//     const { BusinessNode, BusinessNodeType, NodeDetails } = req.dbModels;
//     try {
//         let { page = 1, limit = 10, noLimit = false, search = "" } = req.query;

//         page = Number(page);
//         limit = Number(limit);
//         const offset = (page - 1) * limit;

//         const businessNode = await BusinessNode.findAndCountAll({
//             // where: {
//             //     node_type_code: { [Op.ne]: null },
//             //     tenant_business_flow_id: { [Op.ne]: null },
//             // },
//             include: [
//                 {
//                     model: BusinessNodeType,
//                     as: "type"
//                 },
//                 {
//                     model: NodeDetails,
//                     as: "nodeDetails"
//                 },
//             ],
//             ...(noLimit ? {} : { limit, offset }),
//             order: [["createdAt", "ASC"]]
//         });
//         if (!businessNode) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

//         const totalItems = businessNode.count;
//         const totalPages = Math.ceil(totalItems / limit);

//         return res.status(200).json({
//             success: true,
//             code: 200,
//             message: "Fetched Successfully.",
//             data: businessNode.rows,
//             ...(noLimit ? {} : {
//                 meta: {
//                     totalItems,
//                     totalPages,
//                     currentPage: page,
//                     limit
//                 }
//             })
//         });

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ success: false, code: 500, message: error.message });
//     }
// });


/** for store */
export const allMfgNodes = asyncHandler(async (req, res) => {
    const { BusinessNode, NodeDetails } = req.dbModels;
    try {
        const businessNode = await BusinessNode.findAll({
            where: { node_type_code: "L-101" },
            include: [
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                },
            ]
        });
        if (!businessNode) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const formatResponse = businessNode?.map(i => i.nodeDetails)

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: formatResponse
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});


export const allRegisteredNodes = asyncHandler(async (req, res) => {
    const { BusinessNode, BusinessNodeType, NodeDetails } = req.dbModels;
    try {
        let { page = 1, limit = 10, id = "", noLimit = false, search = "", isAllowOwner = "false", isAttachCurrentNode = "true" } = req.query;

        isAttachCurrentNode = isAttachCurrentNode == "true" ? true : false;
        isAllowOwner = isAllowOwner == "true" ? true : false;

        const currentNode = req.activeNode;

        page = Number(page);
        limit = Number(limit);
        const offset = (page - 1) * limit;

        const businessNode = await NodeDetails.findAndCountAll({
            where: {
                ...(id ? { id: Number(id) } : {}),
                ...(search ? {
                    [Op.or]: [
                        { name: { [Op.iLike]: `%${search}%` } },
                        { location: { [Op.iLike]: `%${search}%` } },
                        { gst_no: { [Op.like]: `%${search}%` } },
                        { license_no: { [Op.like]: `%${search}%` } }
                    ]
                } : {})
            },
            include: [
                {
                    model: BusinessNode,
                    as: "businessNode",
                    where: {
                        ...(isAllowOwner ? {} : { node_type_code: { [Op.ne]: null } }),
                        ...(isAttachCurrentNode ? {} : { id: { [Op.ne]: currentNode } })
                    },
                    include: [
                        {
                            model: BusinessNodeType,
                            as: "type"
                        }
                    ]
                }
            ],
            ...((noLimit || id) ? {} : { limit, offset }),
            order: [["createdAt", "ASC"]]
        });
        if (!businessNode) return res.status(500).json({ success: false, code: 500, message: "Fetched failed!!!" });

        const totalItems = businessNode.count;
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            code: 200,
            message: "Fetched Successfully.",
            data: id ? businessNode.rows[0] : businessNode.rows,
            ...((noLimit || id) ? {} : {
                pagination: {
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

export const deleteNode = asyncHandler(async (req, res) => {
    const { BusinessNode } = req.dbModels;
    try {
        const { id } = req.params;
        const node = await BusinessNode.destroy({ where: { id } });
        if (!node) return res.status(500).json({ success: false, code: 500, message: "Deleted failed!!!" });
        return res.status(200).json({ success: true, code: 200, message: "Deleted Successfully." });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
});