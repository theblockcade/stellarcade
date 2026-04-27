# profile-perks

## Public Reads

### `active_perk_summary(user: Address) -> ActivePerkSummary`

Returns the active-perk summary and next unlock target for a user.

Fallback behavior:
- If the catalog is not configured, `configured = false` and numeric fields are zeroed.
- Unknown users default to `points = 0`.

### `unlock_gap(user: Address) -> UnlockGapSnapshot`

Returns the remaining gap to the next perk unlock.

Fallback and zero-value conventions:
- If the catalog is not configured, `configured = false`.
- When every tier is already unlocked, `all_perks_unlocked = true` and `points_to_unlock = 0`.
