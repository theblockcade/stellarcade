export type SoundPreset = "arcade-80s" | "synthwave" | "cyberpunk" | "silent";

export interface AudioMixerConfig {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
  preset: SoundPreset;
  isMuted: boolean;
}

export interface AmbientSoundMixerProps {
  isOpen: boolean;
  initialConfig?: AudioMixerConfig;
  onConfigChange: (config: AudioMixerConfig) => void;
  onClose: () => void;
}

export interface AudioSliderProps {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  testId?: string;
}

export const DEFAULT_AUDIO_MIXER_CONFIG: AudioMixerConfig = {
  master: 80,
  music: 60,
  sfx: 70,
  ambient: 50,
  preset: "arcade-80s",
  isMuted: false,
};

// The issue text names presets two different ways ("Retro Arcade,
// Cyberpunk Lounge, Chill Lo-Fi" vs. the more literal pill spec "Arcade
// 80s, Synthwave, Cyberpunk, Silent") — the pill list is used verbatim here
// since it's given as the actual UI element spec.
export const SOUND_PRESETS: { id: SoundPreset; label: string }[] = [
  { id: "arcade-80s", label: "Arcade 80s" },
  { id: "synthwave", label: "Synthwave" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "silent", label: "Silent" },
];

export const AMBIENT_MIXER_STORAGE_KEY = "stellarcade:ambient-sound-mixer:config";
