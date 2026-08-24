'use client';

import React, { useState, useMemo } from 'react';
import { ActivityHeatmapProps, HeatmapDay, TooltipData } from './types';
import './ActivityHeatmap.css';

const COLOR_SCHEMES = {
  green: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  neon: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#ff6b6b'],
  arcade: ['#2d2d2d', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'],
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data = [],
  startDate,
  endDate,
  colorScheme = 'green',
  className = '',
  testId = 'activity-heatmap',
}) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { heatmapDays, gridStart } = useMemo(() => {
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate 
      ? new Date(startDate) 
      : new Date(endDateObj.getTime() - 365 * 24 * 60 * 60 * 1000);

    const dataMap = new Map(data.map(d => [d.date, d]));
    
    const days: HeatmapDay[] = [];
    const currentDate = new Date(startDateObj);
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dataPoint = dataMap.get(dateStr);
      
      let level = 0;
      if (dataPoint) {
        if (dataPoint.count >= 10) level = 4;
        else if (dataPoint.count >= 6) level = 3;
        else if (dataPoint.count >= 3) level = 2;
        else if (dataPoint.count >= 1) level = 1;
      }
      
      days.push({
        date: dateStr,
        count: dataPoint?.count || 0,
        metadata: dataPoint?.metadata,
        level,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const startDay = startDateObj.getDay();
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

    return { heatmapDays: days, gridStart: adjustedStartDay };
  }, [data, startDate, endDate]);

  const getIntensityColor = (level: number) => {
    return COLOR_SCHEMES[colorScheme][level] || COLOR_SCHEMES[colorScheme][0];
  };

  const handleMouseEnter = (day: HeatmapDay, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      date: day.date,
      count: day.count,
      metadata: day.metadata,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const weeks = [];
  let currentWeek: HeatmapDay[] = [];
  
  for (let i = 0; i < gridStart; i++) {
    currentWeek.push(null as any);
  }
  
  heatmapDays.forEach((day, index) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getMonthLabel = (weekIndex: number) => {
    if (weekIndex === 0) return null;
    const dayIndex = weekIndex * 7 - gridStart;
    if (dayIndex < 0 || dayIndex >= heatmapDays.length) return null;
    
    const day = heatmapDays[dayIndex];
    const date = new Date(day.date);
    const isFirstOfMonth = date.getDate() === 1;
    
    if (isFirstOfMonth) {
      return MONTHS[date.getMonth()];
    }
    
    return null;
  };

  return (
    <div className={`activity-heatmap ${className}`} data-testid={testId}>
      <div className="activity-heatmap__container">
        <div className="activity-heatmap__header">
          <div className="activity-heatmap__legend">
            <span className="activity-heatmap__legend-label">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="activity-heatmap__legend-item"
                style={{ backgroundColor: getIntensityColor(level) }}
                aria-label={`Activity level ${level}`}
              />
            ))}
            <span className="activity-heatmap__legend-label">More</span>
          </div>
        </div>

        <div className="activity-heatmap__grid-wrapper">
          <div className="activity-heatmap__days-label">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="activity-heatmap__day-label">
                {day}
              </div>
            ))}
          </div>

          <div className="activity-heatmap__grid">
            <div className="activity-heatmap__months">
              {weeks.map((_, weekIndex) => {
                const monthLabel = getMonthLabel(weekIndex);
                return monthLabel ? (
                  <div key={weekIndex} className="activity-heatmap__month-label">
                    {monthLabel}
                  </div>
                ) : null;
              })}
            </div>

            <div className="activity-heatmap__weeks">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="activity-heatmap__week">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="activity-heatmap__day activity-heatmap__day--empty"
                        />
                      );
                    }

                    return (
                      <div
                        key={day.date}
                        className={`activity-heatmap__day activity-heatmap__day--level-${day.level}`}
                        style={{ backgroundColor: getIntensityColor(day.level) }}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                        role="button"
                        tabIndex={0}
                        aria-label={`${day.date}: ${day.count} activities`}
                        data-activity-count={day.count}
                        data-date={day.date}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="activity-heatmap__tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y - 10}px`,
            transform: 'translate(-50%, -100%)',
          }}
          role="tooltip"
          aria-live="polite"
        >
          <div className="activity-heatmap__tooltip-date">{tooltip.date}</div>
          <div className="activity-heatmap__tooltip-count">
            {tooltip.count} {tooltip.count === 1 ? 'activity' : 'activities'}
          </div>
          {tooltip.metadata && (
            <div className="activity-heatmap__tooltip-metadata">
              {tooltip.metadata.matchesPlayed !== undefined && (
                <div>Matches: {tooltip.metadata.matchesPlayed}</div>
              )}
              {tooltip.metadata.xpEarned !== undefined && (
                <div>XP: {tooltip.metadata.xpEarned}</div>
              )}
              {tooltip.metadata.questCheckIns !== undefined && (
                <div>Quests: {tooltip.metadata.questCheckIns}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ActivityHeatmap.displayName = 'ActivityHeatmap';
export default ActivityHeatmap;