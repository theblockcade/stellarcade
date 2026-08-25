'use client';

import React, { useMemo, useRef } from 'react';
import { QuestCardItem } from './QuestCardItem';
import type { DailyQuestCarouselProps, QuestCategory } from './types';
import './DailyQuestCarousel.css';

const FILTERS: { value: QuestCategory; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'milestone', label: 'Milestone' },
];

const SCROLL_STEP_PX = 240;

export const DailyQuestCarousel: React.FC<DailyQuestCarouselProps> = ({
  quests,
  activeFilter,
  onFilterChange,
  onClaim,
  className = '',
  testId = 'daily-quest-carousel',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const filteredQuests = useMemo(
    () => quests.filter((quest) => quest.category === activeFilter),
    [quests, activeFilter],
  );

  const allClaimedOrEmpty =
    filteredQuests.length === 0 ||
    filteredQuests.every((quest) => quest.claimed && quest.progress >= quest.target);

  const scrollBy = (delta: number) => {
    trackRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className={`daily-quest-carousel ${className}`} data-testid={testId}>
      <div
        className="daily-quest-carousel__filter-strip"
        role="tablist"
        aria-label="Quest category filter"
      >
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter.value}
            className={`daily-quest-carousel__filter-pill ${
              activeFilter === filter.value ? 'daily-quest-carousel__filter-pill--active' : ''
            }`}
            onClick={() => onFilterChange(filter.value)}
            data-testid={`${testId}-filter-${filter.value}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {allClaimedOrEmpty ? (
        <div className="daily-quest-carousel__empty" data-testid={`${testId}-empty`}>
          <p>All {activeFilter} quests complete — check back next cycle!</p>
        </div>
      ) : (
        <div className="daily-quest-carousel__viewport">
          <button
            type="button"
            className="daily-quest-carousel__arrow daily-quest-carousel__arrow--left"
            onClick={() => scrollBy(-SCROLL_STEP_PX)}
            aria-label="Scroll quests left"
            data-testid={`${testId}-arrow-left`}
          >
            ‹
          </button>

          <div
            className="daily-quest-carousel__track"
            ref={trackRef}
            role="list"
            data-testid={`${testId}-track`}
          >
            {filteredQuests.map((quest) => (
              <div className="daily-quest-carousel__item" role="listitem" key={quest.id}>
                <QuestCardItem quest={quest} onClaim={onClaim} />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="daily-quest-carousel__arrow daily-quest-carousel__arrow--right"
            onClick={() => scrollBy(SCROLL_STEP_PX)}
            aria-label="Scroll quests right"
            data-testid={`${testId}-arrow-right`}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

DailyQuestCarousel.displayName = 'DailyQuestCarousel';
export default DailyQuestCarousel;
