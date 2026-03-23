# Repo Hygiene Manifest — Wave Tracking

Machine-generated record for issue #192. Each entry lists the file, its disposition, and the zero-reference proof used to justify deletion.

---

## Wave 1 — Frontend

| File | Status | Reason |
|------|--------|--------|
| `frontend/README.md` | **kept** | Only file present; no dead code to remove |

No removals. Frontend surface is a single README stub.

---

## Wave 2 — Backend

### Deleted

| File | Reason | Zero-reference proof |
|------|--------|----------------------|
| `backend/src/utils/helpers.js` | Exports `isValidStellarAddress` and imports `_logger` (unused, prefixed `_`). Neither the export nor the module itself is imported anywhere in runtime, tests, or docs. | `grep -r "require.*utils/helpers\|isValidStellarAddress" backend/` → 0 hits outside the file itself |

### Kept

| File | Reason |
|------|--------|
| `backend/src/utils/logger.js` | Active proxy re-exporting `config/logger`; 11 consumer files across controllers, middleware, models, services, and `server.js` |
| `backend/src/config/logger.js` | Canonical winston logger used by `utils/logger.js` |
| `backend/tests/unit/placeholder.test.js` | Placeholder scaffolding; not tied to any removed module |
| `backend/tests/integration/placeholder.test.js` | Placeholder scaffolding; not tied to any removed module |

### Ambiguous / Flagged for Follow-up

| File | Note |
|------|------|
| `backend/tests/unit/placeholder.test.js` | Zero functional value (`expect(true).toBe(true)`); candidate for replacement with real unit tests when backend logic is implemented |
| `backend/tests/integration/placeholder.test.js` | Same as above |

---

## Wave 3 — Contracts (structure/noise only)

### Deleted (config noise)

| File / Section | Reason | Zero-behavior-impact proof |
|----------------|--------|---------------------------|
| `[profile.release]` block in `contracts/access-control/Cargo.toml` | Duplicate of workspace-root profile; cargo warns it is ignored | `cargo test` in workspace produces no profile-override behavior change |
| `[profile.release]` block in `contracts/balance-management/Cargo.toml` | Same as above | Same |
| `[profile.release]` block in `contracts/emergency-pause/Cargo.toml` | Same as above | Same |
| `[profile.release]` block in `contracts/higher-lower/Cargo.toml` | Same as above | Same |
| `[profile.release]` block in `contracts/prize-pool/Cargo.toml` | Same as above | Same |
| `[profile.release]` block in `contracts/trivia-game/Cargo.toml` | Same as above | Same |

### Kept

| File | Reason |
|------|--------|
| `contracts/coin-flip/README.md` | Valid per-contract doc; actively describes gameplay and integrations |
| `contracts/prize-pool/README.md` | Valid per-contract doc; describes all public functions and storage |
| `contracts/random-generator/README.md` | Valid per-contract doc; describes commit-reveal scheme |
| `contracts/README.md` | Workspace-level doc; lists all 9 crates |
| All `src/lib.rs` files | Contract source; no logic/interface changes made in this wave |

---

## Exit Criteria Verification

| Check | Result |
|-------|--------|
| Frontend typecheck/tests pass | N/A (no build tooling yet) |
| Backend tests pass after Wave 2 | `npm test` → 2 passed, 0 failed |
| Contract workspace tests pass after Wave 3 | `cargo test` → 1 passed (prize-pool), 0 failed across all 9 crates |
| No broken imports from deleted files | `grep -r "utils/helpers"` → 0 hits |
