import React, { useMemo, useState } from "react";
import { TrophyFilter, TrophyShowcaseGridProps } from "./types";
import { TrophyCard } from "./TrophyCard";

const FILTER_TABS: Array<{ key: TrophyFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "unlocked", label: "Unlocked" },
  { key: "in_progress", label: "In Progress" },
  { key: "locked", label: "Locked" },
];

export const TrophyShowcaseGrid: React.FC<TrophyShowcaseGridProps> = ({
  trophies,
  onSelectTrophy,
  columns = 4,
}) => {
  const [filter, setFilter] = useState<TrophyFilter>("all");

  const filteredTrophies = useMemo(() => {
    if (filter === "all") return trophies;
    return trophies.filter((t) => t.status === filter);
  }, [trophies, filter]);

  return (
    <div className="trophy-showcase-grid-container" data-testid="trophy-showcase-grid-container">
      <div className="trophy-filter-tabs" data-testid="trophy-filter-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`trophy-filter-tab${filter === tab.key ? " trophy-filter-tab--active" : ""}`}
            onClick={() => setFilter(tab.key)}
            data-testid={`trophy-filter-tab-${tab.key}`}
            aria-pressed={filter === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className={`trophy-showcase-grid trophy-showcase-grid--cols-${columns}`}
        data-testid="trophy-showcase-grid"
      >
        {filteredTrophies.length === 0 ? (
          <p className="trophy-empty-message" data-testid="trophy-empty-message">
            No trophies in this category yet.
          </p>
        ) : (
          filteredTrophies.map((trophy) => (
            <TrophyCard key={trophy.id} trophy={trophy} onSelect={onSelectTrophy} />
          ))
        )}
      </div>
    </div>
  );
};
