'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { SoundFeedbackContext, useSoundFeedbackState, getDefaultHapticForSound } from './useSoundFeedback';
import type { SoundType, HapticPattern } from './useSoundFeedback';

export interface SoundHapticsProviderProps {
  children: ReactNode;
}

/**
 * Provides synthesized sound + haptic feedback to descendant components via
 * `useSoundFeedback()`. Wrap your app (or the arcade/game shell) once with
 * this provider near the root.
 */
export const SoundHapticsProvider: React.FC<SoundHapticsProviderProps> = ({ children }) => {
  const state = useSoundFeedbackState();

  return <SoundFeedbackContext.Provider value={state}>{children}</SoundFeedbackContext.Provider>;
};

SoundHapticsProvider.displayName = 'SoundHapticsProvider';
export default SoundHapticsProvider;

/**
 * Convenience helper: plays a sound cue and its default companion haptic
 * pattern (if one is mapped) in one call.
 */
export function playSoundWithHaptic(
  playSound: (sound: SoundType) => void,
  triggerHaptic: (pattern?: HapticPattern) => void,
  sound: SoundType
): void {
  playSound(sound);
  const pattern = getDefaultHapticForSound(sound);
  if (pattern) {
    triggerHaptic(pattern);
  }
}
