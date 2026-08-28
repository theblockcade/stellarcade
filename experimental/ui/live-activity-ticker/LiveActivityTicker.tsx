import React, { useState } from "react";
import { LiveActivityTickerProps, TickerSpeed } from "./types";
import { ActivityPill } from "./ActivityPill";

const SPEED_DURATIONS_S: Record<TickerSpeed, number> = {
  slow: 60,
  normal: 35,
  fast: 18,
};

export const LiveActivityTicker: React.FC<LiveActivityTickerProps> = ({
  events,
  speed = "normal",
  onSelectEvent,
}) => {
  const [isPaused, setIsPaused] = useState(false);

  if (events.length === 0) {
    return (
      <div className="live-activity-ticker live-activity-ticker--empty" data-testid="live-activity-ticker-empty">
        <p className="ticker-empty-message">No recent activity yet.</p>
      </div>
    );
  }

  const durationS = SPEED_DURATIONS_S[speed];

  return (
    <div
      className="live-activity-ticker"
      data-testid="live-activity-ticker"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className={`live-activity-ticker-track${isPaused ? " live-activity-ticker-track--paused" : ""}`}
        data-testid="live-activity-ticker-track"
        data-paused={isPaused}
        style={{ animationDuration: `${durationS}s` }}
      >
        {/* Render the event list twice back-to-back so the CSS marquee loop
            (translateX(-50%)) is seamless — the second copy is what scrolls
            into view as the first copy scrolls out. */}
        {[...events, ...events].map((event, i) => (
          <ActivityPill
            key={`${event.id}-${i}`}
            event={event}
            onSelect={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
};
