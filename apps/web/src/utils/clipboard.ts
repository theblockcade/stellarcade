import { useState, useCallback, useRef, useEffect } from "react";

export interface ClipboardResult {
  success: boolean;
  error?: Error;
}

export type CopyFeedbackState = "idle" | "success" | "error";

export interface UseCopyFeedbackOptions {
  feedbackDurationMs?: number;
  onSuccess?: (text: string) => void;
  onError?: (error: Error) => void;
}

export interface UseCopyFeedbackReturn {
  state: CopyFeedbackState;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

export function useCopyFeedback(
  options: UseCopyFeedbackOptions = {}
): UseCopyFeedbackReturn {
  const { feedbackDurationMs = 2000, onSuccess, onError } = options;
  const [state, setState] = useState<CopyFeedbackState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setState("idle");
  }, [clearTimer]);

  const copy = useCallback(
    async (text: string) => {
      clearTimer();
      const result = await copyToClipboard(text);

      if (result.success) {
        setState("success");
        onSuccess?.(text);
      } else {
        setState("error");
        onError?.(result.error ?? new Error("Copy failed"));
      }

      timerRef.current = setTimeout(() => {
        setState("idle");
        timerRef.current = null;
      }, feedbackDurationMs);
    },
    [clearTimer, feedbackDurationMs, onSuccess, onError]
  );

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { state, copy, reset };
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
    textArea.style.pointerEvents = "none";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (result) {
      return { success: true };
    }
    return { success: false, error: new Error("document.execCommand failed") };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
