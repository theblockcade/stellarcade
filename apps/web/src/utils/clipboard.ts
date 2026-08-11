export interface ClipboardResult {
  success: boolean;
  error?: Error;
}

export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  if (!text) {
    return { success: false, error: new Error("Cannot copy empty text") };
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch {
      // fallback
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand("copy");
    document.body.removeChild(textArea);

    return { success: !!result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
