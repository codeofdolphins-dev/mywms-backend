import bcrypt from "bcrypt";

export async function hashPassword(pass) {
    return await bcrypt.hash(pass, parseInt(process.env.SALTROUNDS, 10) || 10);
};

/**
 * 
 * @param {string} sentence string
 * @returns string
 */
export function removeFirstWord(sentence) {
    const result = sentence.trim().split(' ').slice(1).join(' ');

    return result.length > 0 ? result : "";
}

/** Helper */
/**
 * 
 * @param {object} dbObject 
 * @param {number} nodeId 
 */
export async function fetchNodeDetails(dbObject, nodeId) {
    try {
        const { BusinessNode, NodeDetails, User } = dbObject;

        if (!NodeDetails) return null;

        let node = await BusinessNode.findByPk(Number(nodeId), {
            include: [
                {
                    model: NodeDetails,
                    as: "nodeDetails"
                },
                {
                    model: User,
                    where: { is_owner: true },
                    attributes: ["id", "name", "meta", "email", "phone_no", 'address', "company_name"],
                    as: "businessNodeUser",
                    through: {
                        attributes: ["isNodeAdmin", "department"]
                    },
                },
            ]
        });
        node = node.toJSON();
        node.businessNodeUser = node.businessNodeUser[0];

        return node;

    } catch (error) {
        throw error;
    }
}