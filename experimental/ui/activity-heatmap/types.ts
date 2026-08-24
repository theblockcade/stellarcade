export interface ActivityDataPoint {
  date: string;
  count: number;
  metadata?: {
    matchesPlayed?: number;
    xpEarned?: number;
    questCheckIns?: number;
    [key: string]: any;
  };
}

export type ColorScheme = 'green' | 'neon' | 'arcade';

export interface ActivityHeatmapProps {
  data: ActivityDataPoint[];
  startDate?: string;
  endDate?: string;
  colorScheme?: ColorScheme;
  className?: string;
  testId?: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
  metadata?: ActivityDataPoint['metadata'];
  level: number;
}

export interface TooltipData {
  date: string;
  count: number;
  metadata?: ActivityDataPoint['metadata'];
  x: number;
  y: number;
}