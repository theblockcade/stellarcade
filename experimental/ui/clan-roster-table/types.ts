export type ClanRole = 'leader' | 'officer' | 'member';

export interface ClanMember {
  id: string;
  name: string;
  role: ClanRole;
  trophies: number;
  /** ISO 8601 timestamp of last activity. */
  lastActive: string;
}

export type SortColumn = 'rank' | 'name' | 'role' | 'trophies' | 'lastActive';
export type SortDirection = 'asc' | 'desc';

export interface ClanRosterTableProps {
  members: ClanMember[];
  currentUserRole: ClanRole;
  onRoleChange: (memberId: string, newRole: ClanRole) => Promise<void>;
  onKick: (memberId: string) => Promise<void>;
  className?: string;
  testId?: string;
}

export type MemberAction = 'promote' | 'demote' | 'transfer' | 'kick';

export interface MemberActionMenuProps {
  member: ClanMember;
  currentUserRole: ClanRole;
  onRoleChange: (memberId: string, newRole: ClanRole) => Promise<void>;
  onKick: (memberId: string) => Promise<void>;
  testId?: string;
}
