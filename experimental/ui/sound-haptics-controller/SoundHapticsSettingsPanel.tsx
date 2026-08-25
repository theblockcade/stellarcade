'use client';

import React from 'react';
import { useSoundFeedback } from './useSoundFeedback';
import './SoundHapticsSettingsPanel.css';

export interface SoundHapticsSettingsPanelProps {
  className?: string;
  testId?: string;
}

/**
 * Settings panel for the sound/haptics feedback system: a master volume
 * slider, SFX/Music mute toggles, and a haptics toggle. Reads and writes
 * through `useSoundFeedback()`, so it must be rendered within a
 * `SoundHapticsProvider` to have any effect (it still renders safely
 * outside one, backed by the no-op default context).
 */
export const SoundHapticsSettingsPanel: React.FC<SoundHapticsSettingsPanelProps> = ({
  className = '',
  testId = 'sound-haptics-settings-panel',
}) => {
  const { settings, updateSettings, playSound, isAudioSupported, isHapticsSupported } = useSoundFeedback();

  const handleVolumeChange = (value: number) => {
    updateSettings({ masterVolume: value });
  };

  const handleVolumeCommit = () => {
    playSound('click');
  };

  return (
    <div className={`sound-haptics-settings-panel ${className}`} data-testid={testId}>
      <h3 className="sound-haptics-settings-panel__title">Sound & Haptics</h3>

      <div className="sound-haptics-settings-panel__row">
        <label htmlFor={`${testId}-volume`} className="sound-haptics-settings-panel__label">
          Master Volume
        </label>
        <input
          id={`${testId}-volume`}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={settings.masterVolume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          onMouseUp={handleVolumeCommit}
          onTouchEnd={handleVolumeCommit}
          disabled={!isAudioSupported}
          data-testid={`${testId}-volume`}
          aria-valuetext={`${Math.round(settings.masterVolume * 100)}%`}
        />
        <span className="sound-haptics-settings-panel__value">
          {Math.round(settings.masterVolume * 100)}%
        </span>
      </div>

      <div className="sound-haptics-settings-panel__row">
        <label htmlFor={`${testId}-sfx-mute`} className="sound-haptics-settings-panel__label">
          Mute SFX
        </label>
        <input
          id={`${testId}-sfx-mute`}
          type="checkbox"
          checked={settings.sfxMuted}
          onChange={(e) => updateSettings({ sfxMuted: e.target.checked })}
          disabled={!isAudioSupported}
          data-testid={`${testId}-sfx-mute`}
        />
      </div>

      <div className="sound-haptics-settings-panel__row">
        <label htmlFor={`${testId}-music-mute`} className="sound-haptics-settings-panel__label">
          Mute Music
        </label>
        <input
          id={`${testId}-music-mute`}
          type="checkbox"
          checked={settings.musicMuted}
          onChange={(e) => updateSettings({ musicMuted: e.target.checked })}
          disabled={!isAudioSupported}
          data-testid={`${testId}-music-mute`}
        />
      </div>

      <div className="sound-haptics-settings-panel__row">
        <label htmlFor={`${testId}-haptics-toggle`} className="sound-haptics-settings-panel__label">
          Haptic Feedback
        </label>
        <input
          id={`${testId}-haptics-toggle`}
          type="checkbox"
          checked={settings.hapticsEnabled}
          onChange={(e) => updateSettings({ hapticsEnabled: e.target.checked })}
          disabled={!isHapticsSupported}
          data-testid={`${testId}-haptics-toggle`}
        />
      </div>

      {!isAudioSupported && (
        <p className="sound-haptics-settings-panel__notice" data-testid={`${testId}-audio-unsupported`}>
          Sound effects are not supported in this browser.
        </p>
      )}

      {!isHapticsSupported && (
        <p className="sound-haptics-settings-panel__notice" data-testid={`${testId}-haptics-unsupported`}>
          Haptic feedback is not supported on this device.
        </p>
      )}
    </div>
  );
};

SoundHapticsSettingsPanel.displayName = 'SoundHapticsSettingsPanel';
export default SoundHapticsSettingsPanel;
