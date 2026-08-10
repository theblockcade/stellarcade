"use client";

import * as React from "react";
import { useCallback, useId, useState } from "react";

export interface InlineFieldErrorProps {
  error?: string | null;
  id?: string;
  testId?: string;
}

/** Next.js port of frontend/src/components/v1/InlineFieldError.tsx — plain
 * markup (styled with the shared --destructive token) rather than a shadcn
 * primitive, since this is a leaf text node, not a composable surface. */
export const InlineFieldError: React.FC<InlineFieldErrorProps> = ({
  error,
  id,
  testId = "inline-field-error",
}) => {
  if (!error) {
    return null;
  }

  return (
    <span
      id={id}
      className="mt-1 block text-xs font-medium text-destructive"
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      {error}
    </span>
  );
};

InlineFieldError.displayName = "InlineFieldError";

// ── useFieldValidation hook ────────────────────────────────────────────────

export interface FieldValidationState {
  value: string;
  error: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  inputProps: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: () => void;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  };
}

export function useFieldValidation(
  initialValue: string,
  validate: (v: string) => string | null,
): FieldValidationState {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const generatedId = useId();
  const errorId = `field-error-${generatedId}`;

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setValue(next);
      if (touched) {
        setError(validate(next));
      }
    },
    [touched, validate],
  );

  const onBlur = useCallback(() => {
    setTouched(true);
    setError(validate(value));
  }, [validate, value]);

  return {
    value,
    error,
    onChange,
    onBlur,
    inputProps: {
      value,
      onChange,
      onBlur,
      "aria-invalid": error !== null,
      "aria-describedby": error ? errorId : undefined,
    },
  };
}

export default InlineFieldError;
