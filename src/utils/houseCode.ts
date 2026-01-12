export const generateHouseCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Normalizes a house code input:
 * - Trims whitespace
 * - Removes spaces
 * - Converts to uppercase
 * - Removes non-alphanumeric characters
 * - Returns first 6 characters (or all if less than 6)
 */
export const normalizeHouseCode = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, '') // Remove all spaces
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove non-alphanumeric
    .slice(0, 6); // Take first 6 chars
};

