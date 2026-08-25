'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type SoundType = 'click' | 'countdown' | 'win' | 'loss' | 'wager_placed';

export type HapticPattern = 'tap' | 'double_buzz' | 'success_rumble';

export interface SoundHapticsSettings {
  masterVolume: number; // 0..1
  sfxMuted: boolean;
  musicMuted: boolean;
  hapticsEnabled: boolean;
}

export const DEFAULT_SOUND_HAPTICS_SETTINGS: SoundHapticsSettings = {
  masterVolume: 0.7,
  sfxMuted: false,
  musicMuted: false,
  hapticsEnabled: true,
};

export const SOUND_HAPTICS_STORAGE_KEY = 'stellarcade:sound-haptics-settings';

/** Oscillator tone recipe for a given sound cue. */
interface ToneStep {
  frequency: number;
  durationMs: number;
  type?: OscillatorType;
}

const SOUND_RECIPES: Record<SoundType, ToneStep[]> = {
  click: [{ frequency: 440, durationMs: 40, type: 'square' }],
  countdown: [{ frequency: 660, durationMs: 90, type: 'sine' }],
  win: [
    { frequency: 523.25, durationMs: 120, type: 'triangle' },
    { frequency: 659.25, durationMs: 120, type: 'triangle' },
    { frequency: 783.99, durationMs: 180, type: 'triangle' },
  ],
  loss: [
    { frequency: 311.13, durationMs: 160, type: 'sawtooth' },
    { frequency: 220, durationMs: 220, type: 'sawtooth' },
  ],
  wager_placed: [{ frequency: 349.23, durationMs: 70, type: 'sine' }],
};

const HAPTIC_PATTERNS_MS: Record<HapticPattern, number[]> = {
  tap: [15],
  double_buzz: [20, 40, 20],
  success_rumble: [30, 20, 30, 20, 60],
};

const SOUND_TO_HAPTIC: Partial<Record<SoundType, HapticPattern>> = {
  click: 'tap',
  win: 'success_rumble',
  loss: 'double_buzz',
  wager_placed: 'tap',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function loadPersistedSettings(): SoundHapticsSettings {
  if (!isBrowser()) return DEFAULT_SOUND_HAPTICS_SETTINGS;

  try {
    const raw = window.localStorage.getItem(SOUND_HAPTICS_STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_HAPTICS_SETTINGS;

    const parsed = JSON.parse(raw);
    return {
      masterVolume:
        typeof parsed.masterVolume === 'number' && parsed.masterVolume >= 0 && parsed.masterVolume <= 1
          ? parsed.masterVolume
          : DEFAULT_SOUND_HAPTICS_SETTINGS.masterVolume,
      sfxMuted: typeof parsed.sfxMuted === 'boolean' ? parsed.sfxMuted : DEFAULT_SOUND_HAPTICS_SETTINGS.sfxMuted,
      musicMuted:
        typeof parsed.musicMuted === 'boolean' ? parsed.musicMuted : DEFAULT_SOUND_HAPTICS_SETTINGS.musicMuted,
      hapticsEnabled:
        typeof parsed.hapticsEnabled === 'boolean'
          ? parsed.hapticsEnabled
          : DEFAULT_SOUND_HAPTICS_SETTINGS.hapticsEnabled,
    };
  } catch {
    // Corrupt/unavailable storage should never break the app.
    return DEFAULT_SOUND_HAPTICS_SETTINGS;
  }
}

function persistSettings(settings: SoundHapticsSettings): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SOUND_HAPTICS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private browsing, quota exceeded, etc).
    // Silently no-op rather than crash playback/settings updates.
  }
}

/**
 * Lazily creates (and reuses) a single AudioContext. Returns null when the
 * Web Audio API is unavailable (unsupported browser, SSR, or the context
 * has not yet been unlocked by a user gesture and construction throws).
 */
function getOrCreateAudioContext(ref: { current: AudioContext | null }): AudioContext | null {
  if (!isBrowser()) return null;

  const AudioContextCtor =
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return null;

  if (!ref.current) {
    try {
      ref.current = new AudioContextCtor();
    } catch {
      return null;
    }
  }

  return ref.current;
}

function playTone(ctx: AudioContext, step: ToneStep, startAt: number, volume: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = step.type ?? 'sine';
  oscillator.frequency.setValueAtTime(step.frequency, startAt);

  // Simple attack/release envelope so tones don't click at the edges.
  const durationSec = step.durationMs / 1000;
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + Math.min(0.01, durationSec / 4));
  gain.gain.linearRampToValueAtTime(0, startAt + durationSec);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + durationSec);
}

export interface UseSoundFeedbackResult {
  settings: SoundHapticsSettings;
  updateSettings: (patch: Partial<SoundHapticsSettings>) => void;
  playSound: (sound: SoundType) => void;
  triggerHaptic: (pattern?: HapticPattern) => void;
  isAudioSupported: boolean;
  isHapticsSupported: boolean;
}

/**
 * Core sound + haptics feedback hook. Synthesizes short oscillator tones
 * via the Web Audio API and fires `navigator.vibrate` patterns, gated by
 * user mute/haptics preferences persisted to localStorage.
 *
 * Safe by construction: every browser API call is feature-detected, and
 * failures (no AudioContext, no vibrate support, storage errors, or an
 * AudioContext still suspended pending a user gesture) degrade silently
 * rather than throwing.
 */
export function useSoundFeedbackState(): UseSoundFeedbackResult {
  const [settings, setSettings] = useState<SoundHapticsSettings>(() => loadPersistedSettings());
  const audioContextRef = useMemo(() => ({ current: null as AudioContext | null }), []);

  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  const isAudioSupported = useMemo(() => {
    if (!isBrowser()) return false;
    return Boolean(
      window.AudioContext || (window as typeof window & { webkitAudioContext?: unknown }).webkitAudioContext
    );
  }, []);

  const isHapticsSupported = useMemo(() => {
    return isBrowser() && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }, []);

  const updateSettings = useCallback((patch: Partial<SoundHapticsSettings>) => {
    setSettings((prev) => {
      const next: SoundHapticsSettings = { ...prev, ...patch };
      if (typeof next.masterVolume === 'number') {
        next.masterVolume = Math.min(1, Math.max(0, next.masterVolume));
      }
      return next;
    });
  }, []);

  const playSound = useCallback(
    (sound: SoundType) => {
      if (settings.sfxMuted || settings.masterVolume <= 0) return;
      if (!isAudioSupported) return;

      const ctx = getOrCreateAudioContext(audioContextRef);
      if (!ctx) return;

      // Web Audio requires a user gesture to leave the 'suspended' state
      // in most browsers; attempt to resume but never throw if it fails.
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => undefined);
      }

      try {
        const recipe = SOUND_RECIPES[sound];
        let cursor = ctx.currentTime;
        for (const step of recipe) {
          playTone(ctx, step, cursor, settings.masterVolume);
          cursor += step.durationMs / 1000;
        }
      } catch {
        // Never let a playback failure surface to the caller/UI.
      }
    },
    [settings.sfxMuted, settings.masterVolume, isAudioSupported, audioContextRef]
  );

  const triggerHaptic = useCallback(
    (pattern: HapticPattern = 'tap') => {
      if (!settings.hapticsEnabled) return;
      if (!isHapticsSupported) return;

      try {
        navigator.vibrate(HAPTIC_PATTERNS_MS[pattern]);
      } catch {
        // Some browsers throw for disallowed/ignored vibration calls;
        // treat it the same as unsupported.
      }
    },
    [settings.hapticsEnabled, isHapticsSupported]
  );

  return {
    settings,
    updateSettings,
    playSound,
    triggerHaptic,
    isAudioSupported,
    isHapticsSupported,
  };
}

export interface SoundFeedbackContextValue extends UseSoundFeedbackResult {}

const defaultContextValue: SoundFeedbackContextValue = {
  settings: DEFAULT_SOUND_HAPTICS_SETTINGS,
  updateSettings: () => undefined,
  playSound: () => undefined,
  triggerHaptic: () => undefined,
  isAudioSupported: false,
  isHapticsSupported: false,
};

export const SoundFeedbackContext = createContext<SoundFeedbackContextValue>(defaultContextValue);

/**
 * Hook for consuming sound/haptics feedback from within a
 * `SoundHapticsProvider`. Falls back to a safe no-op context value when
 * used outside a provider so consumers never crash, matching the
 * "graceful fallback" acceptance criterion.
 */
export function useSoundFeedback(): SoundFeedbackContextValue {
  return useContext(SoundFeedbackContext);
}

/** Maps a sound cue to its default companion haptic pattern, if any. */
export function getDefaultHapticForSound(sound: SoundType): HapticPattern | undefined {
  return SOUND_TO_HAPTIC[sound];
}
