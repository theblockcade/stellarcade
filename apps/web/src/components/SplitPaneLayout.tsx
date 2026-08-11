"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import "./SplitPaneLayout.css";

export type SplitDirection = "horizontal" | "vertical";

export interface SplitPaneLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  direction?: SplitDirection;
  initialRatio?: number;
  minPaneSize?: number;
  resizable?: boolean;
  className?: string;
  testId?: string;
  onRatioChange?: (ratio: number) => void;
  persistRatio?: boolean;
  persistKey?: string;
}

export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  leftPane,
  rightPane,
  direction = "horizontal",
  initialRatio = 0.5,
  minPaneSize = 200,
  resizable = true,
  className = "",
  testId = "split-pane-layout",
  onRatioChange,
  persistRatio = false,
  persistKey = "split-pane-ratio",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<number>(() => {
    if (persistRatio && typeof window !== "undefined") {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!Number.isNaN(parsed) && parsed > 0 && parsed < 1) {
          return parsed;
        }
      }
    }
    return initialRatio;
  });

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (persistRatio && typeof window !== "undefined") {
      localStorage.setItem(persistKey, ratio.toString());
    }
  }, [ratio, persistRatio, persistKey]);

  useEffect(() => {
    onRatioChange?.(ratio);
  }, [ratio, onRatioChange]);

  const handleMouseDown = useCallback(() => {
    if (!resizable) return;
    setIsDragging(true);
  }, [resizable]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isHorizontal = direction === "horizontal";

      let newRatio: number;
      if (isHorizontal) {
        const offset = e.clientX - rect.left;
        newRatio = offset / rect.width;
      } else {
        const offset = e.clientY - rect.top;
        newRatio = offset / rect.height;
      }

      const containerSize = isHorizontal ? rect.width : rect.height;
      const minRatio = minPaneSize / containerSize;
      const maxRatio = 1 - minRatio;

      newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      setRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, minPaneSize]);

  const containerClass = [
    "split-pane-layout",
    `split-pane-layout--${direction}`,
    isDragging ? "split-pane-layout--dragging" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const leftPercentage = `${ratio * 100}%`;
  const rightPercentage = `${(1 - ratio) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={containerClass}
      data-testid={testId}
      data-direction={direction}
      data-ratio={ratio.toFixed(2)}
    >
      <div
        className="split-pane-layout__pane split-pane-layout__pane--left"
        style={
          direction === "horizontal"
            ? { width: leftPercentage }
            : { height: leftPercentage }
        }
        data-testid={`${testId}-left`}
      >
        {leftPane}
      </div>

      {resizable && (
        <div
          className={`split-pane-layout__divider split-pane-layout__divider--${direction}`}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation={direction === "horizontal" ? "vertical" : "horizontal"}
          aria-label="Resize panes"
          data-testid={`${testId}-divider`}
        />
      )}

      <div
        className="split-pane-layout__pane split-pane-layout__pane--right"
        style={
          direction === "horizontal"
            ? { width: rightPercentage }
            : { height: rightPercentage }
        }
        data-testid={`${testId}-right`}
      >
        {rightPane}
      </div>
    </div>
  );
};

export default SplitPaneLayout;
