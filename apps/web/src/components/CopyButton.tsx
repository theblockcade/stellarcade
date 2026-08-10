"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type buttonVariants } from "./ui/button";
import type { VariantProps } from "class-variance-authority";
import { copyToClipboard } from "../utils/clipboard";
import { useErrorStore } from "../store/errorStore";

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  children?: React.ReactNode;
  testId?: string;
  feedbackDurationMs?: number;
  onCopySuccess?: () => void;
  variant?: "icon" | "text" | "both";
  size?: VariantProps<typeof buttonVariants>["size"];
}

/** Next.js/shadcn port of frontend/src/components/v1/CopyButton.tsx —
 * "variant" here still means icon/text/both display mode (the original's
 * prop name), so the shadcn Button underneath is rendered with a fixed
 * "ghost" visual style and its own separate "size" prop instead. */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  children,
  testId = "copy-button",
  feedbackDurationMs = 2000,
  onCopySuccess,
  variant = "icon",
  size = "icon-sm",
  className = "",
  ...rest
}) => {
  const [copied, setCopied] = useState(false);
  const setError = useErrorStore((state) => state.setError);

  const handleCopy = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setCopied(false);

      try {
        const result = await copyToClipboard(text);
        if (result.success) {
          setCopied(true);
          onCopySuccess?.();
        } else {
          setError({
            code: "CLIPBOARD_NOT_SUPPORTED",
            domain: "ui",
            severity: "user_actionable",
            message: "Unable to copy text to clipboard.",
            action: "Please select and copy the text manually.",
          });
        }
      } catch (error) {
        setError({
          code: "CLIPBOARD_ERROR",
          domain: "ui",
          severity: "terminal",
          message: "An unexpected error occurred while trying to copy text.",
          debug: { originalError: error },
        });
      }
    },
    [text, onCopySuccess, setError],
  );

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), feedbackDurationMs);
    return () => clearTimeout(timeout);
  }, [copied, feedbackDurationMs]);

  return (
    <Button
      type="button"
      variant="ghost"
      size={variant === "text" ? "sm" : size}
      className={className}
      onClick={handleCopy}
      data-testid={testId}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
      aria-live="polite"
      {...rest}
    >
      {(variant === "icon" || variant === "both") &&
        (copied ? <Check data-testid={`${testId}-icon`} /> : <Copy data-testid={`${testId}-icon`} />)}

      {(variant === "text" || variant === "both") && (
        <span data-testid={`${testId}-text`}>{copied ? "Copied!" : children || "Copy"}</span>
      )}
    </Button>
  );
};

export default CopyButton;
