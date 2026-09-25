export type SpectrumTheme = 'neon' | 'phosphor' | 'synthwave';

export interface AudioSpectrumVisualizerProps {
  isPlaying: boolean;
  isMuted?: boolean;
  theme?: SpectrumTheme;
  barCount?: number;
  sensitivity?: number;
  className?: string;
  testId?: string;
}