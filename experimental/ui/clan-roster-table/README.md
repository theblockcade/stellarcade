# Clan Roster Table

A responsive clan membership management table with sortable columns, live search filtering, role chips, and a role-aware administrative action menu.

## Features

- **Sortable Columns**: Rank, Member Name, Role, Trophy Contribution, Last Active — click a header to sort, click again to reverse direction
- **Live Search**: Real-time username filtering
- **Role Chips**: Color-coded Leader / Officer / Member badges
- **Permission-Aware Action Menu**: Leaders can promote/demote/transfer leadership/kick; Officers can only promote plain members; Members see no actions
- **Confirmation Modal**: Destructive actions (kick, demote) require explicit confirmation before executing
- **Accessible Table Semantics**: `aria-sort` on sortable headers, `role="menu"`/`role="dialog"` on the action menu and confirmation

## Installation

```bash
# Copy the component to your project
cp -r experimental/ui/clan-roster-table /path/to/your/components/
```

## Usage

```tsx
import { ClanRosterTable } from './clan-roster-table/ClanRosterTable';
import type { ClanMember } from './clan-roster-table/types';

function ClanPage() {
  const members: ClanMember[] = [
    { id: 'm1', name: 'Alice', role: 'leader', trophies: 5000, lastActive: '2026-08-20T00:00:00Z' },
    { id: 'm2', name: 'Bob', role: 'officer', trophies: 3200, lastActive: '2026-08-22T00:00:00Z' },
  ];

  return (
    <ClanRosterTable
      members={members}
      currentUserRole="leader"
      onRoleChange={async (memberId, newRole) => {
        await api.updateClanRole(memberId, newRole);
      }}
      onKick={async (memberId) => {
        await api.kickClanMember(memberId);
      }}
    />
  );
}
```

## Props

### `ClanRosterTable`

| Prop | Type | Description |
|------|------|-------------|
| `members` | `ClanMember[]` | Full roster; rank is computed from trophy count across all members regardless of the active sort/filter |
| `currentUserRole` | `ClanRole` | The viewing user's role, used to gate which actions each row's menu offers |
| `onRoleChange` | `(memberId: string, newRole: ClanRole) => Promise<void>` | Called for promote/demote/transfer actions |
| `onKick` | `(memberId: string) => Promise<void>` | Called after kick is confirmed |
| `className` | `string?` | Optional extra class name on the root element |
| `testId` | `string?` | Optional root `data-testid` override (default `clan-roster-table`) |

## Permission Model

| Current user role | Actions available on a Member row | Actions available on an Officer row | Actions on the Leader row |
|---|---|---|---|
| Leader | Promote to Officer, Kick | Demote to Member, Transfer Leadership, Kick | None |
| Officer | Promote to Officer | None | None |
| Member | None | None | None |

## Testing

```bash
# Run tests
npm test ClanRosterTable.test.tsx
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS Grid and Flexbox support

## Customization

You can customize the appearance by:

1. Adjusting role chip colors in `ClanRosterTable.css`
2. Changing the default sort column/direction in `ClanRosterTable.tsx`
3. Extending `availableActions` in `MemberActionMenu.tsx` for additional roles or actions
