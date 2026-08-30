import React from "react";
import type { TerritorySectorProps } from "./types";

const STATUS_COLORS: Record<string, string> = {
  neutral: "#4b5563",
  owned: "",
  contested: "#f59e0b",
  locked: "#374151",
};

export const TerritorySector: React.FC<TerritorySectorProps> = ({
  territory,
  ownerColor,
  isSelected = false,
  onClick,
}) => {
  const fillColor =
    territory.status === "owned" && ownerColor
      ? ownerColor
      : STATUS_COLORS[territory.status] ?? "#4b5563";

  const strokeColor = isSelected ? "#f8fafc" : territory.status === "contested" ? "#fbbf24" : "#1e293b";
  const strokeWidth = isSelected ? 3 : 1.5;

  const handleClick = () => {
    if (territory.status !== "locked" && onClick) {
      onClick(territory.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && territory.status !== "locked" && onClick) {
      onClick(territory.id);
    }
  };

  return (
    <g
      data-testid={`territory-sector-${territory.id}`}
      aria-label={`${territory.name} — ${territory.status}`}
      style={{ cursor: territory.status === "locked" ? "not-allowed" : "pointer" }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={territory.status !== "locked" ? 0 : -1}
      role="button"
    >
      <rect
        x={territory.x}
        y={territory.y}
        width={territory.width}
        height={territory.height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        rx={4}
        data-testid={`territory-rect-${territory.id}`}
        aria-selected={isSelected}
      />
      <text
        x={territory.x + territory.width / 2}
        y={territory.y + territory.height / 2 - (territory.resourceValue !== undefined ? 6 : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fill="#f1f5f9"
        fontWeight={isSelected ? 700 : 400}
        data-testid={`territory-label-${territory.id}`}
      >
        {territory.name}
      </text>
      {territory.resourceValue !== undefined && (
        <text
          x={territory.x + territory.width / 2}
          y={territory.y + territory.height / 2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill="#94a3b8"
          data-testid={`territory-resource-${territory.id}`}
        >
          {territory.resourceValue} res
        </text>
      )}
      {territory.status === "contested" && (
        <text
          x={territory.x + territory.width - 6}
          y={territory.y + 6}
          textAnchor="end"
          dominantBaseline="hanging"
          fontSize={10}
          data-testid={`territory-contested-icon-${territory.id}`}
        >
          ⚔
        </text>
      )}
    </g>
  );
};
