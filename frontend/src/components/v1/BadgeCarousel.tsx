import React, { useState, useRef } from 'react';
import './BadgeCarousel.css';

export interface ProfileBadge {
  id: string;
  label: string;
  imageUrl?: string;
  description?: string;
  unlockedAt?: string;
}

export interface BadgeCarouselProps {
  badges: ProfileBadge[];
  visibleCount?: number;
  onBadgeClick?: (badge: ProfileBadge) => void;
  className?: string;
  testId?: string;
}

export const BadgeCarousel: React.FC<BadgeCarouselProps> = ({
  badges = [],
  visibleCount = 3,
  onBadgeClick,
  className = '',
  testId = 'badge-carousel',
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (badges.length === 0) {
    return (
      <div className={`badge-carousel badge-carousel--empty ${className}`} data-testid={`${testId}-empty`}>
        <p>No badges unlocked yet.</p>
      </div>
    );
  }

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(badges.length - visibleCount, prev + 1));
  };

  const visibleBadges = badges.slice(startIndex, startIndex + visibleCount);
  const canPrev = startIndex > 0;
  const canNext = startIndex < badges.length - visibleCount;

  return (
    <div
      ref={containerRef}
      className={`badge-carousel ${className}`}
      data-testid={testId}
      role="region"
      aria-label="Recent Badges Showcase"
    >
      <button
        type="button"
        className="badge-carousel__nav-btn badge-carousel__nav-btn--prev"
        onClick={handlePrev}
        disabled={!canPrev}
        aria-label="Previous badges"
        data-testid={`${testId}-prev-btn`}
      >
        ◀
      </button>

      <div className="badge-carousel__track" data-testid={`${testId}-track`}>
        <div
          className="badge-carousel__slides"
          style={{
            transform: `translateX(0px)`, // Simple CSS flex slice window
          }}
        >
          {visibleBadges.map((badge) => (
            <div
              key={badge.id}
              className="badge-carousel__slide"
              role="button"
              tabIndex={0}
              onClick={() => onBadgeClick?.(badge)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBadgeClick?.(badge);
                }
              }}
              data-testid={`${testId}-badge-${badge.id}`}
              aria-label={`Badge: ${badge.label}. ${badge.description || ''}`}
            >
              <div className="badge-carousel__badge-frame">
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt={badge.label} className="badge-carousel__badge-img" />
                ) : (
                  <div className="badge-carousel__badge-placeholder">
                    🏆
                  </div>
                )}
              </div>
              <div className="badge-carousel__badge-info">
                <span className="badge-carousel__badge-title">{badge.label}</span>
                {badge.unlockedAt && (
                  <span className="badge-carousel__badge-date">
                    {badge.unlockedAt}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="badge-carousel__nav-btn badge-carousel__nav-btn--next"
        onClick={handleNext}
        disabled={!canNext}
        aria-label="Next badges"
        data-testid={`${testId}-next-btn`}
      >
        ▶
      </button>

      <div className="sr-only" aria-live="polite">
        Showing badges {startIndex + 1} to {Math.min(startIndex + visibleCount, badges.length)} of {badges.length}
      </div>
    </div>
  );
};

BadgeCarousel.displayName = 'BadgeCarousel';
export default BadgeCarousel;
