export interface ClanStanding {
  clanId: string;
  clanName: string;
  badgeIcon: string;
  memberCount: number;
  /** Percentage (0-100) of contested territory this clan controls. */
  territoryControlPercent: number;
}

export interface ClanWarsCardProps {
  clans: ClanStanding[];
  userClanId?: string;
  seasonEndsAt: string;
  prizePoolXlm: number;
  onContribute?: () => void;
}

export interface TerritoryProgressBarProps {
  clans: ClanStanding[];
}
