import type { CSSProperties } from "react";

export type ClanMember = {
  address: string;
  role: "owner" | "member";
  joinedAt: string;
  isActive: boolean;
};

export interface ClanRosterTableProps {
  clanId: string;
  members: ClanMember[];
  isLoading?: boolean;
  emptyMessage?: string;
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Displays the active member roster for a given clan. Shows address
 * (truncated), role, join date, and active/inactive status badge.
 * Handles loading and empty states gracefully.
 */
export function ClanRosterTable({
  clanId,
  members,
  isLoading = false,
  emptyMessage,
}: ClanRosterTableProps) {
  if (isLoading) {
    return (
      <div
        className="clan-roster-table clan-roster-table--loading"
        data-testid="clan-roster-loading"
        data-clan-id={clanId}
        style={styles.loadingContainer}
        role="status"
        aria-label="Loading clan roster"
        aria-live="polite"
      >
        <div style={styles.skeletonRow} aria-hidden="true" />
        <div style={styles.skeletonRow} aria-hidden="true" />
        <div style={styles.skeletonRow} aria-hidden="true" />
        <span style={styles.srOnly}>Loading…</span>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div
        className="clan-roster-table clan-roster-table--empty"
        data-testid="clan-roster-empty"
        data-clan-id={clanId}
        style={styles.emptyContainer}
        role="status"
        aria-live="polite"
      >
        {emptyMessage ?? "No active members"}
      </div>
    );
  }

  return (
    <div
      className="clan-roster-table"
      data-testid="clan-roster-table"
      data-clan-id={clanId}
      style={styles.tableWrapper}
    >
      <table style={styles.table} aria-label="Clan member roster">
        <thead>
          <tr style={styles.headerRow}>
            <th scope="col" style={styles.th}>
              Address
            </th>
            <th scope="col" style={styles.th}>
              Role
            </th>
            <th scope="col" style={styles.th}>
              Joined
            </th>
            <th scope="col" style={styles.th}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, idx) => (
            <tr
              key={`${member.address}-${idx}`}
              style={{
                ...styles.row,
                ...(member.isActive ? {} : styles.rowInactive),
              }}
              data-testid={`clan-roster-row-${idx}`}
              aria-label={`Member ${member.address}${member.isActive ? "" : ", inactive"}`}
            >
              <td style={styles.td}>
                <span
                  title={member.address}
                  data-testid={`clan-roster-address-${idx}`}
                  style={styles.addressCell}
                >
                  {truncateAddress(member.address)}
                </span>
              </td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.roleBadge,
                    ...(member.role === "owner"
                      ? styles.roleBadgeOwner
                      : styles.roleBadgeMember),
                  }}
                >
                  {member.role === "owner" ? "Owner" : "Member"}
                </span>
              </td>
              <td style={styles.td}>
                <span style={styles.dateCell}>{formatDate(member.joinedAt)}</span>
              </td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.statusBadge,
                    ...(member.isActive
                      ? styles.statusActive
                      : styles.statusInactive),
                  }}
                  data-testid={`clan-roster-status-${idx}`}
                  aria-label={member.isActive ? "Active" : "Inactive"}
                >
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableWrapper: {
    width: "100%",
    overflowX: "auto" as const,
    borderRadius: "0.5rem",
    border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.875rem",
    color: "var(--text-primary, #f5f7fb)",
  },
  headerRow: {
    borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
  },
  th: {
    padding: "0.625rem 1rem",
    textAlign: "left" as const,
    fontWeight: 600,
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--text-muted, rgba(245,247,251,0.6))",
    backgroundColor: "var(--surface-1, #11161e)",
    whiteSpace: "nowrap" as const,
  },
  row: {
    borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
    transition: "background 0.15s ease",
  } as CSSProperties,
  rowInactive: {
    opacity: 0.45,
  } as CSSProperties,
  td: {
    padding: "0.625rem 1rem",
    verticalAlign: "middle" as const,
  },
  addressCell: {
    fontFamily: "monospace",
    fontSize: "0.8125rem",
    letterSpacing: "0.02em",
  } as CSSProperties,
  dateCell: {
    color: "var(--text-muted, rgba(245,247,251,0.65))",
    fontSize: "0.8125rem",
  } as CSSProperties,
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.125rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.6875rem",
    fontWeight: 600,
    border: "1px solid transparent",
  } as CSSProperties,
  roleBadgeOwner: {
    color: "#a78bfa",
    backgroundColor: "rgba(167,139,250,0.12)",
    borderColor: "rgba(167,139,250,0.3)",
  } as CSSProperties,
  roleBadgeMember: {
    color: "var(--text-muted, rgba(245,247,251,0.6))",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
  } as CSSProperties,
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.125rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.6875rem",
    fontWeight: 600,
    border: "1px solid transparent",
  } as CSSProperties,
  statusActive: {
    color: "#22c55e",
    backgroundColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.3)",
  } as CSSProperties,
  statusInactive: {
    color: "var(--text-muted, rgba(245,247,251,0.45))",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  } as CSSProperties,
  loadingContainer: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    padding: "1rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
  },
  skeletonRow: {
    height: "2rem",
    borderRadius: "0.25rem",
    backgroundColor: "rgba(255,255,255,0.07)",
    animation: "pulse 1.5s ease-in-out infinite",
  } as CSSProperties,
  emptyContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 1rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--border-subtle, rgba(255,255,255,0.1))",
    color: "var(--text-muted, rgba(245,247,251,0.55))",
    fontSize: "0.9375rem",
    fontWeight: 500,
  },
  srOnly: {
    position: "absolute" as const,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden" as const,
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap" as const,
    borderWidth: 0,
  },
} as const;
