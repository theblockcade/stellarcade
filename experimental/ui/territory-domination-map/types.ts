export type TerritoryStatus = "neutral" | "owned" | "contested" | "locked";

export interface Territory {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ownerId?: string;
  status: TerritoryStatus;
  resourceValue?: number;
  adjacentIds?: string[];
}

export interface Player {
  id: string;
  username: string;
  color: string;
  territoriesOwned: number;
  totalResources: number;
}

export interface TerritorySectorProps {
  territory: Territory;
  ownerColor?: string;
  isSelected?: boolean;
  onClick?: (id: string) => void;
}

export interface TerritoryDominationMapProps {
  territories: Territory[];
  players: Player[];
  currentPlayerId?: string;
  selectedTerritoryId?: string;
  onTerritoryClick?: (id: string) => void;
  width?: number;
  height?: number;
}
