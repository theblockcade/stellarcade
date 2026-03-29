/**
 * Clipboard Utility
 *
 * Provides a standardized copy-to-clipboard function with fallback support
 * for environments that do not support navigator.clipboard natively.
 *
 * @module utils/v1/clipboard
 */

export interface ClipboardResult {
  success: boolean;
  error?: Error;
}

/**
 * Copies the given text to the user's clipboard.
 * Uses navigator.clipboard API if available, otherwise falls back to
 * document.execCommand('copy') which supports older browsers and some
 * restrictive environments.
 *
 * @param text The string to copy
 * @returns A promise resolving to a ClipboardResult object
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  if (!text) {
    return { success: false, error: new Error('Cannot copy empty text') };
  }

  // Primary API: modern browsers and secure contexts
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (err) {
      // If the primary API fails (e.g., due to permissions), fall through to the fallback
      console.warn('navigator.clipboard.writeText failed, attempting fallback...', err);
    }
  }

  // Fallback API: older browsers or restricted environments
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    
    // Make invisible
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (result) {
      return { success: true };
    }
    
    return { success: false, error: new Error('document.execCommand failed') };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error(String(err)) 
    };
  }
}
