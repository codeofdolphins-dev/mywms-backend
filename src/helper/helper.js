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
        const { NodeDetails } = dbObject;

        if(!NodeDetails) return null;

        return await NodeDetails.findOne({
            where: { business_node_id: Number(nodeId) }
        });

    } catch (error) {
        throw error;
    }
}