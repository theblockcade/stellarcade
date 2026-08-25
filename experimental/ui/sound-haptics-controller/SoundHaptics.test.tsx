import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import { SoundHapticsProvider, playSoundWithHaptic } from './SoundHapticsProvider';
import { SoundHapticsSettingsPanel } from './SoundHapticsSettingsPanel';
import {
  useSoundFeedback,
  DEFAULT_SOUND_HAPTICS_SETTINGS,
  SOUND_HAPTICS_STORAGE_KEY,
  getDefaultHapticForSound,
} from './useSoundFeedback';

/**
 * Minimal fake AudioContext / OscillatorNode / GainNode sufficient to
 * exercise playSound() without real audio hardware.
 */
class FakeGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

class FakeOscillatorNode {
  type = 'sine';
  frequency = { setValueAtTime: vi.fn() };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class FakeAudioContext {
  state: 'running' | 'suspended' = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    return new FakeOscillatorNode() as unknown as OscillatorNode;
  }
  createGain() {
    return new FakeGainNode() as unknown as GainNode;
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

function withProvider() {
  return ({ children }: { children: React.ReactNode }) => (
    <SoundHapticsProvider>{children}</SoundHapticsProvider>
  );
}

describe('getDefaultHapticForSound', () => {
  it('maps click to tap', () => {
    expect(getDefaultHapticForSound('click')).toBe('tap');
  });

  it('maps win to success_rumble', () => {
    expect(getDefaultHapticForSound('win')).toBe('success_rumble');
  });

  it('returns undefined for countdown (no mapped haptic)', () => {
    expect(getDefaultHapticForSound('countdown')).toBeUndefined();
  });
});

describe('useSoundFeedback (default context, no provider)', () => {
  it('returns safe no-op defaults when used outside a provider', () => {
    const { result } = renderHook(() => useSoundFeedback());

    expect(result.current.settings).toEqual(DEFAULT_SOUND_HAPTICS_SETTINGS);
    expect(result.current.isAudioSupported).toBe(false);
    expect(result.current.isHapticsSupported).toBe(false);

    // None of these should throw.
    expect(() => result.current.playSound('click')).not.toThrow();
    expect(() => result.current.triggerHaptic()).not.toThrow();
    expect(() => result.current.updateSettings({ sfxMuted: true })).not.toThrow();
  });
});

describe('SoundHapticsProvider + useSoundFeedback', () => {
  const originalAudioContext = (window as any).AudioContext;
  const originalVibrate = navigator.vibrate;

  beforeEach(() => {
    window.localStorage.clear();
    (window as any).AudioContext = FakeAudioContext;
    (navigator as any).vibrate = vi.fn(() => true);
  });

  afterEach(() => {
    (window as any).AudioContext = originalAudioContext;
    (navigator as any).vibrate = originalVibrate;
    vi.restoreAllMocks();
  });

  it('initializes with default settings when localStorage is empty', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });
    expect(result.current.settings).toEqual(DEFAULT_SOUND_HAPTICS_SETTINGS);
  });

  it('persists settings to localStorage on update', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

    act(() => {
      result.current.updateSettings({ masterVolume: 0.3, sfxMuted: true });
    });

    const raw = window.localStorage.getItem(SOUND_HAPTICS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.masterVolume).toBe(0.3);
    expect(parsed.sfxMuted).toBe(true);
  });

  it('initializes from previously persisted localStorage settings', () => {
    window.localStorage.setItem(
      SOUND_HAPTICS_STORAGE_KEY,
      JSON.stringify({ masterVolume: 0.9, sfxMuted: true, musicMuted: true, hapticsEnabled: false })
    );

    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

    expect(result.current.settings).toEqual({
      masterVolume: 0.9,
      sfxMuted: true,
      musicMuted: true,
      hapticsEnabled: false,
    });
  });

  it('falls back to defaults when localStorage contains malformed JSON', () => {
    window.localStorage.setItem(SOUND_HAPTICS_STORAGE_KEY, '{not valid json');

    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });
    expect(result.current.settings).toEqual(DEFAULT_SOUND_HAPTICS_SETTINGS);
  });

  it('clamps masterVolume updates to the [0, 1] range', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

    act(() => {
      result.current.updateSettings({ masterVolume: 5 });
    });
    expect(result.current.settings.masterVolume).toBe(1);

    act(() => {
      result.current.updateSettings({ masterVolume: -2 });
    });
    expect(result.current.settings.masterVolume).toBe(0);
  });

  it('toggles mute state independently for sfx and music', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

    act(() => {
      result.current.updateSettings({ sfxMuted: true });
    });
    expect(result.current.settings.sfxMuted).toBe(true);
    expect(result.current.settings.musicMuted).toBe(false);

    act(() => {
      result.current.updateSettings({ musicMuted: true });
    });
    expect(result.current.settings.musicMuted).toBe(true);
  });

  it('detects Web Audio support when AudioContext exists', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });
    expect(result.current.isAudioSupported).toBe(true);
  });

  it('detects haptics support when navigator.vibrate exists', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });
    expect(result.current.isHapticsSupported).toBe(true);
  });

  it('does not call vibrate when hapticsEnabled is false', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

    act(() => {
      result.current.updateSettings({ hapticsEnabled: false });
    });
    act(() => {
      result.current.triggerHaptic('tap');
    });

    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it('calls vibrate with the mapped pattern when haptics are enabled', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

    act(() => {
      result.current.triggerHaptic('double_buzz');
    });

    expect(navigator.vibrate).toHaveBeenCalledWith([20, 40, 20]);
  });

  it('does not throw when playSound is called while muted', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

    act(() => {
      result.current.updateSettings({ sfxMuted: true });
    });

    expect(() => act(() => result.current.playSound('win'))).not.toThrow();
  });

  it('does not throw when playSound is called with audio supported', () => {
    const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });
    expect(() => act(() => result.current.playSound('win'))).not.toThrow();
  });

  describe('graceful fallback when browser APIs are unavailable', () => {
    it('reports audio unsupported and never throws when AudioContext is missing', () => {
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

      expect(result.current.isAudioSupported).toBe(false);
      expect(() => act(() => result.current.playSound('click'))).not.toThrow();
    });

    it('reports haptics unsupported and never throws when navigator.vibrate is missing', () => {
      delete (navigator as any).vibrate;

      const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });

      expect(result.current.isHapticsSupported).toBe(false);
      expect(() => act(() => result.current.triggerHaptic())).not.toThrow();
    });

    it('never throws even if navigator.vibrate itself throws', () => {
      (navigator as any).vibrate = vi.fn(() => {
        throw new Error('vibrate blocked');
      });

      const { result } = renderHook(() => useSoundFeedback(), { wrapper: withProvider() });
      expect(() => act(() => result.current.triggerHaptic())).not.toThrow();
    });
  });
});

describe('playSoundWithHaptic', () => {
  it('calls playSound and the mapped haptic trigger', () => {
    const playSound = vi.fn();
    const triggerHaptic = vi.fn();

    playSoundWithHaptic(playSound, triggerHaptic, 'win');

    expect(playSound).toHaveBeenCalledWith('win');
    expect(triggerHaptic).toHaveBeenCalledWith('success_rumble');
  });

  it('does not call triggerHaptic when the sound has no mapped pattern', () => {
    const playSound = vi.fn();
    const triggerHaptic = vi.fn();

    playSoundWithHaptic(playSound, triggerHaptic, 'countdown');

    expect(playSound).toHaveBeenCalledWith('countdown');
    expect(triggerHaptic).not.toHaveBeenCalled();
  });
});

describe('SoundHapticsSettingsPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    (window as any).AudioContext = FakeAudioContext;
    (navigator as any).vibrate = vi.fn(() => true);
  });

  it('renders volume, mute, and haptics controls', () => {
    render(
      <SoundHapticsProvider>
        <SoundHapticsSettingsPanel />
      </SoundHapticsProvider>
    );

    expect(screen.getByTestId('sound-haptics-settings-panel-volume')).toBeInTheDocument();
    expect(screen.getByTestId('sound-haptics-settings-panel-sfx-mute')).toBeInTheDocument();
    expect(screen.getByTestId('sound-haptics-settings-panel-music-mute')).toBeInTheDocument();
    expect(screen.getByTestId('sound-haptics-settings-panel-haptics-toggle')).toBeInTheDocument();
  });

  it('updates the volume display when the slider changes', () => {
    render(
      <SoundHapticsProvider>
        <SoundHapticsSettingsPanel />
      </SoundHapticsProvider>
    );

    const slider = screen.getByTestId('sound-haptics-settings-panel-volume');
    fireEvent.change(slider, { target: { value: '0.2' } });

    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('toggles the SFX mute checkbox', () => {
    render(
      <SoundHapticsProvider>
        <SoundHapticsSettingsPanel />
      </SoundHapticsProvider>
    );

    const checkbox = screen.getByTestId('sound-haptics-settings-panel-sfx-mute') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('shows an unsupported notice when AudioContext is unavailable', () => {
    delete (window as any).AudioContext;
    delete (window as any).webkitAudioContext;

    render(
      <SoundHapticsProvider>
        <SoundHapticsSettingsPanel />
      </SoundHapticsProvider>
    );

    expect(screen.getByTestId('sound-haptics-settings-panel-audio-unsupported')).toBeInTheDocument();
  });

  it('shows an unsupported notice when navigator.vibrate is unavailable', () => {
    delete (navigator as any).vibrate;

    render(
      <SoundHapticsProvider>
        <SoundHapticsSettingsPanel />
      </SoundHapticsProvider>
    );

    expect(screen.getByTestId('sound-haptics-settings-panel-haptics-unsupported')).toBeInTheDocument();
  });
});
