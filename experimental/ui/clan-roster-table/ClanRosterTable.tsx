'use client';

import React, { useMemo, useState } from 'react';
import { MemberActionMenu } from './MemberActionMenu';
import type { ClanMember, ClanRosterTableProps, SortColumn, SortDirection } from './types';
import './ClanRosterTable.css';

const ROLE_LABELS: Record<ClanMember['role'], string> = {
  leader: 'Leader',
  officer: 'Officer',
  member: 'Member',
};

const ROLE_RANK: Record<ClanMember['role'], number> = {
  leader: 0,
  officer: 1,
  member: 2,
};

function formatLastActive(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString();
}

function compareMembers(
  a: ClanMember,
  b: ClanMember,
  column: SortColumn,
  rankOf: Map<string, number>,
): number {
  switch (column) {
    case 'rank':
      return (rankOf.get(a.id) ?? 0) - (rankOf.get(b.id) ?? 0);
    case 'name':
      return a.name.localeCompare(b.name);
    case 'role':
      return ROLE_RANK[a.role] - ROLE_RANK[b.role];
    case 'trophies':
      return a.trophies - b.trophies;
    case 'lastActive':
      return new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime();
    default:
      return 0;
  }
}

const COLUMNS: { key: SortColumn; label: string }[] = [
  { key: 'rank', label: 'Rank' },
  { key: 'name', label: 'Member Name' },
  { key: 'role', label: 'Role' },
  { key: 'trophies', label: 'Trophy Contribution' },
  { key: 'lastActive', label: 'Last Active' },
];

export const ClanRosterTable: React.FC<ClanRosterTableProps> = ({
  members,
  currentUserRole,
  onRoleChange,
  onKick,
  className = '',
  testId = 'clan-roster-table',
}) => {
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('trophies');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Trophy-descending rank, computed once from the full roster so it stays
  // stable regardless of which column the table is currently sorted by or
  // how the search filter narrows the visible rows.
  const rankOf = useMemo(() => {
    const byTrophies = [...members].sort((a, b) => b.trophies - a.trophies);
    return new Map(byTrophies.map((member, index) => [member.id, index + 1]));
  }, [members]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return members;
    }
    return members.filter((member) => member.name.toLowerCase().includes(query));
  }, [members, search]);

  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers].sort((a, b) => compareMembers(a, b, sortColumn, rankOf));
    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [filteredMembers, sortColumn, sortDirection, rankOf]);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  return (
    <div className={`clan-roster-table ${className}`} data-testid={testId}>
      <div className="clan-roster-table__toolbar">
        <input
          type="search"
          className="clan-roster-table__search"
          placeholder="Search members…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search clan members"
          data-testid={`${testId}-search`}
        />
      </div>

      <table className="clan-roster-table__table" data-testid={`${testId}-grid`}>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const isActive = column.key === sortColumn;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                >
                  <button
                    type="button"
                    className="clan-roster-table__sort-btn"
                    onClick={() => handleSort(column.key)}
                    data-testid={`${testId}-sort-${column.key}`}
                  >
                    {column.label}
                    {isActive && (
                      <span aria-hidden="true">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </button>
                </th>
              );
            })}
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedMembers.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length + 1} className="clan-roster-table__empty">
                No members match &ldquo;{search}&rdquo;.
              </td>
            </tr>
          ) : (
            sortedMembers.map((member) => (
              <tr key={member.id} data-testid={`${testId}-row-${member.id}`}>
                <td>{rankOf.get(member.id)}</td>
                <td>{member.name}</td>
                <td>
                  <span className={`clan-roster-table__role-chip clan-roster-table__role-chip--${member.role}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                </td>
                <td>{member.trophies.toLocaleString()}</td>
                <td>{formatLastActive(member.lastActive)}</td>
                <td>
                  <MemberActionMenu
                    member={member}
                    currentUserRole={currentUserRole}
                    onRoleChange={onRoleChange}
                    onKick={onKick}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

ClanRosterTable.displayName = 'ClanRosterTable';
export default ClanRosterTable;
