import { Op } from "sequelize";

/**
 * 
 * @param {string} userBusinessNodeId user business node id
 * @param {object} BusinessNode DB models
 * @returns object
 */
export const getAllowedBusinessNodes = async (userBusinessNodeId, models, removeSelf = true) => {

    const { BusinessNode, NodeDetails, TenantBusinessFlow, ManufacturingUnit } = models;

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

        // const sequences = [userNode.parentFlow.sequence];
        const sequences = userNode.parentFlow.sequence;

        // console.log("sequences", sequences);
        // return


        // if (sequences > 1) {
        //     sequences.push(userNode.parentFlow.sequence - 1);
        // }
        // if (sequences - 1 === 1) {
        //     const res = await BusinessNode.findAll({
        //         include: [
        //             {
        //                 model: TenantBusinessFlow,
        //                 as: "parentFlow",
        //                 where: {
        //                     sequence: 1,
        //                     is_active: true
        //                 },
        //                 order: [["sequence", "DESC"]]
        //             },
        //             {
        //                 model: ManufacturingUnit,
        //                 as: "unitLocations",
        //                 where: {
        //                     store_type: "fg_store",
        //                     isActive: true
        //                 }
        //             }
        //         ],
        //     });

        //     let formatresponse = [];
        //     for (const r of res) {
        //         // console.log("r", r.toJSON())
        //         formatresponse = [...formatresponse, ...r.unitLocations]
        //     }

        //     // for (const i of formatresponse) {
        //     //     console.log(i);
        //     // }

        //     return formatresponse;
        // }

        return BusinessNode.findAll({
            where: {
                ...(removeSelf && { id: { [Op.ne]: Number(userBusinessNodeId) } })
            },
            include: [
                {
                    model: TenantBusinessFlow,
                    as: "parentFlow",
                    where: {
                        // sequence: { [Op.in]: sequences },
                        sequence: sequences - 1,
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
