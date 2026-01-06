import { Op } from "sequelize";
import { asyncHandler } from "../utils/asyncHandler.js";

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


export { tenantBusinessNodeList }