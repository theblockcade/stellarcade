import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureFlagsProvider, DEFAULT_FEATURE_FLAGS } from '@/services/feature-flags';
import { useFeatureFlag } from '@/hooks/v1/useFeatureFlag';

type TestProps = {
  flag: string;
};

function TestComponent({ flag }: TestProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enabled = useFeatureFlag(flag as any);
  return <div data-testid="flag-value">{String(enabled)}</div>;
}

describe('useFeatureFlag', () => {
  it('returns defaults when no overrides provided', () => {
    render(
      <FeatureFlagsProvider>
        <TestComponent flag="commandPalette" />
      </FeatureFlagsProvider>,
    );

    expect(screen.getByTestId('flag-value')).toHaveTextContent(
      String(DEFAULT_FEATURE_FLAGS.commandPalette),
    );
  });

  it('applies provider overrides and allows setter updates', () => {
    render(
      <FeatureFlagsProvider overrides={{ commandPalette: false }}>
        <TestComponent flag="commandPalette" />
      </FeatureFlagsProvider>,
    );

    expect(screen.getByTestId('flag-value')).toHaveTextContent('false');
  });

  it('returns false for unknown flags safely', () => {
    render(
      <FeatureFlagsProvider>
        <TestComponent flag="unknownFlag" />
      </FeatureFlagsProvider>,
    );

    expect(screen.getByTestId('flag-value')).toHaveTextContent('false');
  });
});
