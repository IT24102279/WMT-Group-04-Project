/**
 * Generates a unique transaction or reference ID
 * @param {string} prefix - The prefix for the ID (e.g., 'TX', 'INV', 'PAT')
 * @returns {string} - A unique ID string
 */
export const generateId = (prefix = 'ID') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};
