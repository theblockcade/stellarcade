import { useMemo } from 'react';
import { useFeatureFlags, type FeatureFlagKey } from '@/services/feature-flags';

export function useFeatureFlag<K extends FeatureFlagKey>(key: K): boolean {
  const { getFlag } = useFeatureFlags();

  return useMemo(() => {
    try {
      return getFlag(key);
    } catch {
      return false;
    }
  }, [getFlag, key]);
}

export function useFeatureFlagsState() {
  const { flags, setFlag, resetFlags } = useFeatureFlags();
  return { flags, setFlag, resetFlags };
}
