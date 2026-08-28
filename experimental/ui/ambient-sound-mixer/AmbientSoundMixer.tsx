import React, { useEffect, useState } from "react";
import { AudioSlider } from "./AudioSlider";
import {
  AmbientSoundMixerProps,
  AMBIENT_MIXER_STORAGE_KEY,
  AudioMixerConfig,
  DEFAULT_AUDIO_MIXER_CONFIG,
  SOUND_PRESETS,
  SoundPreset,
} from "./types";

/** Loads a persisted config from localStorage, falling back to
 * `fallback` on any error (private browsing, corrupted JSON, quota, etc.)
 * or when nothing has been saved yet. */
export function loadPersistedConfig(fallback: AudioMixerConfig): AudioMixerConfig {
  try {
    const raw = window.localStorage.getItem(AMBIENT_MIXER_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

export function persistConfig(config: AudioMixerConfig): void {
  try {
    window.localStorage.setItem(AMBIENT_MIXER_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Storage unavailable (private browsing, quota exceeded) — the mixer
    // still works for the current session, it just won't persist.
  }
}

/** Applies a named preset's channel levels on top of the current config,
 * preserving master volume and mute state (a preset changes the *mix*, not
 * whether the whole thing is audible). */
export function applyPreset(config: AudioMixerConfig, preset: SoundPreset): AudioMixerConfig {
  const presetLevels: Record<SoundPreset, Pick<AudioMixerConfig, "music" | "sfx" | "ambient">> = {
    "arcade-80s": { music: 70, sfx: 80, ambient: 40 },
    synthwave: { music: 65, sfx: 50, ambient: 65 },
    cyberpunk: { music: 55, sfx: 60, ambient: 75 },
    silent: { music: 0, sfx: 0, ambient: 0 },
  };

  return { ...config, ...presetLevels[preset], preset };
}

export const AmbientSoundMixer: React.FC<AmbientSoundMixerProps> = ({
  isOpen,
  initialConfig,
  onConfigChange,
  onClose,
}) => {
  const [config, setConfig] = useState<AudioMixerConfig>(() =>
    loadPersistedConfig(initialConfig ?? DEFAULT_AUDIO_MIXER_CONFIG),
  );

  useEffect(() => {
    persistConfig(config);
    onConfigChange(config);
    // onConfigChange intentionally omitted: callers commonly pass a fresh
    // inline function each render, which would otherwise re-fire this
    // effect (and re-persist) on every render even when config is
    // unchanged.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const updateChannel = (channel: "master" | "music" | "sfx" | "ambient", value: number) => {
    setConfig((prev) => ({ ...prev, [channel]: value }));
  };

  const toggleMute = () => {
    setConfig((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const selectPreset = (preset: SoundPreset) => {
    setConfig((prev) => applyPreset(prev, preset));
  };

  if (!isOpen) return null;

  return (
    <div className="ambient-sound-mixer" data-testid="ambient-sound-mixer" role="dialog" aria-label="Sound mixer">
      <div className="ambient-sound-mixer-header">
        <h2>Sound Mixer</h2>
        <button type="button" onClick={onClose} aria-label="Close sound mixer" data-testid="ambient-mixer-close">
          ✕
        </button>
      </div>

      <div className="ambient-mixer-master-row">
        <AudioSlider
          label="Master Volume"
          value={config.master}
          disabled={config.isMuted}
          onChange={(v) => updateChannel("master", v)}
          testId="ambient-mixer-master"
        />
        <button
          type="button"
          className={config.isMuted ? "ambient-mixer-mute ambient-mixer-mute--active" : "ambient-mixer-mute"}
          onClick={toggleMute}
          aria-pressed={config.isMuted}
          data-testid="ambient-mixer-mute-toggle"
        >
          {config.isMuted ? "Unmute" : "Mute"}
        </button>
      </div>

      <AudioSlider
        label="Music"
        value={config.music}
        disabled={config.isMuted}
        onChange={(v) => updateChannel("music", v)}
        testId="ambient-mixer-music"
      />
      <AudioSlider
        label="SFX"
        value={config.sfx}
        disabled={config.isMuted}
        onChange={(v) => updateChannel("sfx", v)}
        testId="ambient-mixer-sfx"
      />
      <AudioSlider
        label="Ambient Noise"
        value={config.ambient}
        disabled={config.isMuted}
        onChange={(v) => updateChannel("ambient", v)}
        testId="ambient-mixer-ambient"
      />

      <div className="ambient-mixer-presets" data-testid="ambient-mixer-presets">
        {SOUND_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={
              config.preset === p.id
                ? "ambient-mixer-preset-pill ambient-mixer-preset-pill--active"
                : "ambient-mixer-preset-pill"
            }
            onClick={() => selectPreset(p.id)}
            aria-pressed={config.preset === p.id}
            data-testid={`ambient-mixer-preset-${p.id}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className="ambient-mixer-equalizer"
        data-testid="ambient-mixer-equalizer"
        aria-hidden="true"
      >
        {[config.music, config.sfx, config.ambient].map((level, i) => (
          <span
            key={i}
            className="ambient-mixer-equalizer-bar"
            data-testid={`ambient-mixer-equalizer-bar-${i}`}
            style={{ height: `${config.isMuted ? 4 : Math.max(4, level)}%` }}
          />
        ))}
      </div>
    </div>
  );
};
