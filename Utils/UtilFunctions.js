export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Lowercase the text, remove the accents and the punctuation.
 * Used every time we compare what the player types with what we expect (chatbot answers, name of the culprit).
 */
export const normalizeText = (text) => text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:()'"-]/g, "")
    .trim();
