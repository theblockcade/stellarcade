export type Theme = 'amber' | 'crt-green' | 'cyber-blue';

export interface PixelScoreTickerProps {
  value: number;
  digits?: number;
  durationMs?: number;
  theme?: Theme;
  onTickSound?: () => void;
}