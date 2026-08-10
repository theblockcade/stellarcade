import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  InlineFieldError,
  useFieldValidation,
} from '../../src/components/v1/InlineFieldError';

describe('InlineFieldError', () => {
  it('renders nothing when error is null', () => {
    render(<InlineFieldError error={null} testId="ife" />);
    expect(screen.queryByTestId('ife')).not.toBeInTheDocument();
  });

  it('renders nothing when error is undefined', () => {
    render(<InlineFieldError testId="ife" />);
    expect(screen.queryByTestId('ife')).not.toBeInTheDocument();
  });

  it('renders error message with role alert', () => {
    render(<InlineFieldError error="This field is required" testId="ife" />);
    const el = screen.getByTestId('ife');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('role', 'alert');
    expect(el).toHaveAttribute('aria-live', 'assertive');
    expect(el).toHaveTextContent('This field is required');
  });

  it('sets provided id on the error element', () => {
    render(<InlineFieldError error="Invalid email" id="email-error" testId="ife" />);
    expect(screen.getByTestId('ife')).toHaveAttribute('id', 'email-error');
  });
});

// ── useFieldValidation hook ────────────────────────────────────────────────

function TestInput({
  initialValue,
  validate,
}: {
  initialValue: string;
  validate: (v: string) => string | null;
}) {
  const { error, inputProps } = useFieldValidation(initialValue, validate);

  return (
    <div>
      <input data-testid="field-input" {...inputProps} />
      <InlineFieldError error={error} testId="field-error" />
    </div>
  );
}

describe('useFieldValidation', () => {
  it('starts with no error', () => {
    const validate = vi.fn().mockReturnValue(null);
    render(<TestInput initialValue="" validate={validate} />);
    expect(screen.queryByTestId('field-error')).not.toBeInTheDocument();
  });

  it('does not show error while typing before blur', () => {
    const validate = vi.fn().mockReturnValue('Required');
    render(<TestInput initialValue="" validate={validate} />);
    fireEvent.change(screen.getByTestId('field-input'), {
      target: { value: 'x' },
    });
    expect(screen.queryByTestId('field-error')).not.toBeInTheDocument();
  });

  it('sets error on blur when validate returns a string', () => {
    const validate = vi.fn().mockReturnValue('Required');
    render(<TestInput initialValue="" validate={validate} />);
    fireEvent.blur(screen.getByTestId('field-input'));
    expect(screen.getByTestId('field-error')).toHaveTextContent('Required');
  });

  it('clears error when value becomes valid after blur', () => {
    const validate = vi.fn((v: string) => (v === '' ? 'Required' : null));
    render(<TestInput initialValue="" validate={validate} />);

    // First blur triggers error
    fireEvent.blur(screen.getByTestId('field-input'));
    expect(screen.getByTestId('field-error')).toBeInTheDocument();

    // Now type a valid value — error clears immediately since touched
    fireEvent.change(screen.getByTestId('field-input'), {
      target: { value: 'hello' },
    });
    expect(screen.queryByTestId('field-error')).not.toBeInTheDocument();
  });

  it('inputProps includes aria-invalid true when there is an error', () => {
    const validate = vi.fn().mockReturnValue('Error');
    render(<TestInput initialValue="" validate={validate} />);
    fireEvent.blur(screen.getByTestId('field-input'));
    expect(screen.getByTestId('field-input')).toHaveAttribute('aria-invalid', 'true');
  });

  it('inputProps aria-invalid is false when no error', () => {
    const validate = vi.fn().mockReturnValue(null);
    render(<TestInput initialValue="" validate={validate} />);
    fireEvent.blur(screen.getByTestId('field-input'));
    expect(screen.getByTestId('field-input')).toHaveAttribute('aria-invalid', 'false');
  });
});
