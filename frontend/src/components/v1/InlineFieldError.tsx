import React, { useCallback, useId, useState } from 'react';
import './InlineFieldError.css';

export interface InlineFieldErrorProps {
  error?: string | null;
  id?: string;
  testId?: string;
}

export const InlineFieldError: React.FC<InlineFieldErrorProps> = ({
  error,
  id,
  testId = 'inline-field-error',
}) => {
  if (!error) {
    return null;
  }

  return (
    <span
      id={id}
      className="inline-field-error"
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      {error}
    </span>
  );
};

InlineFieldError.displayName = 'InlineFieldError';

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
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
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
      'aria-invalid': error !== null,
      'aria-describedby': error ? errorId : undefined,
    },
  };
}

export default InlineFieldError;
