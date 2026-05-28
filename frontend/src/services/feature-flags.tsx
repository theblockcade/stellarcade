import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export const DEFAULT_FEATURE_FLAGS = {
  commandPalette: true,
  profileSettings: true,
  dataTable: true,
} as const;

export type FeatureFlagKey = keyof typeof DEFAULT_FEATURE_FLAGS;
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

function parseFlagOverrides(raw?: string | null): Partial<FeatureFlags> {
  if (!raw || typeof raw !== 'string') {
    return {};
  }

  return raw.split(',').reduce<Partial<FeatureFlags>>((acc, pair) => {
    const [rawKey, rawValue] = pair.split('=').map((v) => v.trim());
    if (!rawKey) return acc;
    const key = rawKey as FeatureFlagKey;
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_FEATURE_FLAGS, key)) {
      return acc;
    }
    if (rawValue === undefined) {
      return acc;
    }
    const value = rawValue.toLowerCase();
    if (value === 'true' || value === '1') {
      acc[key] = true;
    } else if (value === 'false' || value === '0') {
      acc[key] = false;
    }

    return acc;
  }, {});
}

export interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  getFlag: (key: FeatureFlagKey) => boolean;
  setFlag: (key: FeatureFlagKey, value: boolean) => void;
  resetFlags: () => void;
}

const defaultContextValue: FeatureFlagsContextValue = {
  flags: { ...DEFAULT_FEATURE_FLAGS },
  getFlag: () => false,
  setFlag: () => undefined,
  resetFlags: () => undefined,
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>(
  defaultContextValue,
);

export interface FeatureFlagsProviderProps {
  children: ReactNode;
  overrides?: Partial<FeatureFlags>;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  children,
  overrides = {},
}) => {
  const envOverrides = useMemo(() => {
    if (import.meta.env.DEV) {
      const features = import.meta.env.VITE_FEATURE_FLAG_OVERRIDES;
      return parseFlagOverrides(features as string | undefined);
    }
    return {};
  }, []);

  const [flags, setFlags] = useState<FeatureFlags>(() => {
    return {
      ...DEFAULT_FEATURE_FLAGS,
      ...envOverrides,
      ...overrides,
    };
  });

  const getFlag = (key: FeatureFlagKey): boolean => {
    return flags[key] ?? false;
  };

  const setFlag = (key: FeatureFlagKey, value: boolean): void => {
    setFlags((prev) => ({ ...prev, [key]: value }));
  };

  const resetFlags = (): void => {
    setFlags({ ...DEFAULT_FEATURE_FLAGS, ...envOverrides });
  };

  const value: FeatureFlagsContextValue = {
    flags,
    getFlag,
    setFlag,
    resetFlags,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export function useFeatureFlags(): FeatureFlagsContextValue {
  return useContext(FeatureFlagsContext);
}
