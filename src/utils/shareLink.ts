/**
 * Builds a shareable link for a house using HashRouter format
 * @param houseCode - The 6-character house code
 * @returns Full shareable URL with hash router path
 */
export const buildHouseShareLink = (houseCode: string): string => {
  const origin = window.location.origin;
  return `${origin}/#/house/${houseCode}`;
};

/**
 * Copies text to clipboard with fallback for older browsers
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (err) {
    console.warn('Clipboard API failed, using fallback', err);
  }

  // Fallback for older browsers
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error('execCommand copy failed');
    }
  } finally {
    document.body.removeChild(textArea);
  }
};

