/**
 * Example Usage of SplitMetadataLayout
 *
 * This example demonstrates how to integrate the split-metadata layout system
 * in a game detail page with responsive behavior and loading states.
 */

import { useState, useEffect } from "react";
import { SplitMetadataLayout } from "../SplitMetadata";
import type { MetadataSection } from "../SplitMetadata/types";

interface GameDetailExampleProps {
  gameId: string;
}

export function GameDetailExample({ gameId }: GameDetailExampleProps) {
  const [gameData, setGameData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setGameData({
        title: "Pattern Puzzle",
        description: "A commit-reveal puzzle game where players guess patterns.",
        totalPlayers: 150,
        winRate: 0.45,
        totalRewards: 1250,
        rewardCurrency: "GAME",
        status: "active",
        nextRound: "2024-06-15T10:00:00Z",
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameId]);

  // Define metadata sections
  const metadataSections: MetadataSection[] = [
    {
      id: "stats",
      title: "Game Statistics",
      collapsible: true,
      defaultOpen: true,
      visible: true,
      fields: [
        {
          id: "totalPlayers",
          label: "Total Players",
          value: gameData?.totalPlayers || "-",
          loading: isLoading,
          visible: true,
        },
        {
          id: "winRate",
          label: "Win Rate",
          value: gameData ? `${(gameData.winRate * 100).toFixed(1)}%` : "-",
          loading: isLoading,
          visible: true,
          helpText: "Win rate over all time",
        },
        {
          id: "status",
          label: "Status",
          value: (
            <span className={`status-badge status-${gameData?.status || "unknown"}`}>
              {gameData?.status || "-"}
            </span>
          ),
          loading: isLoading,
          visible: true,
        },
      ],
    },
    {
      id: "rewards",
      title: "Reward Information",
      collapsible: true,
      defaultOpen: true,
      visible: true,
      fields: [
        {
          id: "totalRewards",
          label: "Total Rewards",
          value: gameData
            ? `${gameData.totalRewards} ${gameData.rewardCurrency}`
            : "-",
          loading: isLoading,
          visible: true,
        },
        {
          id: "nextRound",
          label: "Next Round",
          value: gameData
            ? new Date(gameData.nextRound).toLocaleString()
            : "-",
          loading: isLoading,
          visible: true,
          helpText: "When the next game round starts",
        },
      ],
    },
  ];

  const primaryContent = (
    <div className="game-detail-content">
      <h1>{gameData?.title || "Loading..."}</h1>
      <p>{gameData?.description || "Loading game details..."}</p>

      {gameData && (
        <div className="game-rules">
          <h2>How to Play</h2>
          <ol>
            <li>Admin creates a puzzle with a commitment hash</li>
            <li>Players submit their pattern guesses</li>
            <li>Admin reveals the correct pattern</li>
            <li>Winners share the prize pool</li>
          </ol>
        </div>
      )}
    </div>
  );

  return (
    <SplitMetadataLayout
      primaryContent={primaryContent}
      metadataSections={metadataSections}
      isLoading={isLoading}
      emptyMessage="Game data not available"
      onFieldInteraction={(fieldId: string, sectionId: string) => {
        console.log(`User interacted with field "${fieldId}" in section "${sectionId}"`);
        // Handle analytics, navigation, or other interactions
      }}
    />
  );
}

/**
 * Example with paginated/scrollable metadata
 */
export function LargeMetadataExample() {
  const [_expandedSectionId, _setExpandedSectionId] = useState<string | null>(null);

  // Generate many fields to demonstrate scrolling
  const generateFields = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `field-${i}`,
      label: `Field ${i + 1}`,
      value: `Value ${i + 1}`,
      visible: true,
      loading: false,
    }));

  const metadataSections: MetadataSection[] = [
    {
      id: "section1",
      title: "Section 1",
      collapsible: true,
      defaultOpen: false,
      visible: true,
      fields: generateFields(10),
    },
    {
      id: "section2",
      title: "Section 2",
      collapsible: true,
      defaultOpen: false,
      visible: true,
      fields: generateFields(8),
    },
  ];

  return (
    <SplitMetadataLayout
      primaryContent={
        <div>
          <h1>Large Data Example</h1>
          <p>Click section titles to expand/collapse metadata.</p>
        </div>
      }
      metadataSections={metadataSections}
      stackBreakpoint={768}
    />
  );
}
