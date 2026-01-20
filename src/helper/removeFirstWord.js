export function removeFirstWord(sentence) {
    // Trim leading/trailing whitespace and split the string into an array of words
    const words = sentence.trim().split(' ');

    // Use slice(1) to get all elements from the second word to the end
    const remainingWords = words.slice(1);

    // Join the remaining words back into a sentence with spaces
    const result = remainingWords.join(' ');

    return result.length > 0 ? result : "";
}