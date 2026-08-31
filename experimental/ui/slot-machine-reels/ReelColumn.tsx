import React, { useEffect, useRef, useState } from "react";
import type { SlotReelProps, SlotSymbol } from "./types";

const SYMBOL_EMOJI: Record<SlotSymbol, string> = {
  star: "⭐",
  diamond: "💎",
  coin: "🪙",
  crown: "👑",
  bell: "🔔",
  seven: "7️⃣",
  bar: "BAR",
  cherry: "🍒",
};

export const ReelColumn: React.FC<SlotReelProps> = ({
  symbols,
  isSpinning,
  landedSymbol,
  reelIndex,
  stopDelayMs = 0,
}) => {
  const [displaySymbol, setDisplaySymbol] = useState<SlotSymbol>(
    landedSymbol ?? symbols[0]
  );
  const [blurring, setBlurring] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSpinning) {
      setBlurring(true);
      let idx = 0;
      tickRef.current = setInterval(() => {
        idx = (idx + 1) % symbols.length;
        setDisplaySymbol(symbols[idx]);
      }, 80);
    } else {
      if (tickRef.current) clearInterval(tickRef.current);
      timerRef.current = setTimeout(() => {
        setBlurring(false);
        setDisplaySymbol(landedSymbol ?? symbols[0]);
      }, stopDelayMs);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSpinning, landedSymbol, symbols, stopDelayMs]);

  return (
    <div
      className={`slot-reel ${isSpinning ? "slot-reel--spinning" : "slot-reel--stopped"}`}
      data-testid={`reel-column-${reelIndex}`}
      aria-label={`Reel ${reelIndex + 1}: ${isSpinning ? "spinning" : displaySymbol}`}
    >
      <div
        className={`slot-reel__symbol ${blurring ? "slot-reel__symbol--blur" : ""}`}
        data-testid={`reel-symbol-${reelIndex}`}
      >
        {SYMBOL_EMOJI[displaySymbol]}
      </div>
    </div>
  );
};
