/**
 * 
 * @param {string} prefix code eg: REQ, PO
 * @param {Number} suffixId that record id
 * @returns {String} String
 */
export function generateNo(prefix, suffixId) {
    try {
        if (!prefix || !suffixId) throw new Error("Both fields are required to generate No!!!");

        const year = new Date().getFullYear();
        const monthName = new Date().toLocaleString('default', { month: 'short' });

        return `${prefix}-${year}-${monthName}-${Date.now()}-${suffixId}`
    } catch (error) {
        throw error;
    }
};

/**
 * 
 * @param {Number} id record id
 * @returns {string} generated batch no
 */
export function generateBatch(id) {
    try {
        if (!id) throw new Error("id must required!!!");

        const date = new Date();

        const year = date.getFullYear();
        // getMonth() is zero-based (0 is January), so add 1
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const YYYYMMDD = `${year}${month}${day}`;

        return `${YYYYMMDD}-000${id}`;

    } catch (error) {
        throw error;
    }
};