import { Op } from "sequelize";

/**
 * 
 * @param {string} userBusinessNodeId user business node id
 * @param {object} BusinessNode DB models
 * @returns object
 */
export const getAllowedBusinessNodes = async (userBusinessNodeId, models, removeSelf = true) => {

    const { BusinessNode, NodeDetails, TenantBusinessFlow } = models;

    try {
        const userNode = await BusinessNode.findByPk(userBusinessNodeId, {
            include: [
                {
                    model: TenantBusinessFlow,
                    as: "parentFlow",
                    where: { is_active: true }
                }
            ]
        });
        if (!userNode) {
            throw new Error("Business node not found");
        }

        const sequences = [userNode.parentFlow.sequence];

        console.log(sequences);
        // return


        if (userNode.parentFlow.sequence > 1) {
            sequences.push(userNode.parentFlow.sequence - 1);
        }

        return BusinessNode.findAll({
            where: {
                ...(removeSelf && { id: { [Op.ne]: Number(userBusinessNodeId) } })
            },
            include: [
                {
                    model: TenantBusinessFlow,
                    as: "parentFlow",
                    where: {
                        sequence: { [Op.in]: sequences },
                        is_active: true
                    },
                    order: [["sequence", "DESC"]]
                },
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                }
            ],
        });
    } catch (error) {
        throw error;
    }
};
