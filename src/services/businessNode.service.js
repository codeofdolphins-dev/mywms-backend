import { Op } from "sequelize";

/**
 * 
 * @param {string} userBusinessNodeId user business node id
 * @param {object} BusinessNode DB models
 * @returns object
 */
export const getAllowedBusinessNodes = async (userBusinessNodeId, models) => {

    const { BusinessNode, NodeDetails } = models;

    try {
        const userNode = await BusinessNode.findByPk(userBusinessNodeId);
        if (!userNode) {
            throw new Error("Business node not found");
        }

        const sequences = [userNode.sequence];

        if (userNode.sequence > 1) {
            sequences.push(userNode.sequence - 1);
        }

        return BusinessNode.findAll({
            where: {
                sequence: sequences,
                id: { [Op.ne]: Number(userBusinessNodeId) }
            },
            include: [
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                }
            ],
            order: [["sequence", "DESC"]]
        });
    } catch (error) {
        throw error;
    }
};
