/**
 * 
 * @param {string} sentence string
 * @returns string
 */
export function removeFirstWord(sentence) {
    const result = sentence.trim().split(' ').slice(1).join(' ');

    return result.length > 0 ? result : "";
}