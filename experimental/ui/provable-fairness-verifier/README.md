# Provable Fairness Verifier

A self-contained React card that lets players verify game server seed commitments, revealed
secret seeds, and client nonces using deterministic client-side SHA-256. No backend calls, no
external APIs — everything is computed in the browser.

## Features

- **Input fields** for Server Seed Hash (commitment), Revealed Server Seed, Client Seed, and Nonce.
- **Real-time SHA-256 verification** showing whether `SHA256(revealedSeed)` matches the initial
  commitment hash.
- **Outcome computation** rendering the resulting game roll (dice 0-99) and coin toss (Heads/Tails).
- **Status indicator pill**: Verified (green), Mismatch (red), Pending (gray).
- **Copy Verification Proof** button that copies a full verification summary to the clipboard.
- **Accessible**: visible labels, `role="status"` with `aria-live`, keyboard-friendly.
- **Self-contained**: pure TypeScript SHA-256 (FIPS 180-4) — works offline and in SSR environments.

## Installation

```bash
# Copy the component into your project
cp -r experimental/ui/provable-fairness-verifier /path/to/your/components/
```

## Usage

```tsx
import { ProvableFairnessVerifier } from './provable-fairness-verifier/ProvableFairnessVerifier';
import type { VerificationSummary } from './provable-fairness-verifier/types';

function FairnessCard() {
  const handleVerify = (result: VerificationSummary) => {
    console.log('verification result', result);
  };

  return (
    <ProvableFairnessVerifier
      initialServerSeedHash="a1b2c3d4e5f6..."
      initialRevealedSeed="secret-seed"
      initialClientSeed="player-seed"
      initialNonce={1}
      onVerify={handleVerify}
    />
  );
}
```

## Props

| Prop                    | Type                                             | Default | Description                                  |
|-------------------------|--------------------------------------------------|---------|----------------------------------------------|
| `initialServerSeedHash` | `string`                                         | `''`    | The committed server seed hash               |
| `initialRevealedSeed`   | `string`                                         | `''`    | The revealed secret server seed              |
| `initialClientSeed`     | `string`                                         | `''`    | The player-facing client seed                |
| `initialNonce`          | `number`                                         | `0`     | The round nonce                              |
| `onVerify`              | `(result: VerificationSummary) => void`          | —       | Fired whenever the verification result changes |
| `testId`                | `string`                                         | `'provable-fairness-verifier'` | Root test id             |

## Outcome formula

The game outcome is derived deterministically as:

```
combined   = `${revealedSeed}:${clientSeed}:${nonce}`
hash       = SHA-256(combined)
dice roll  = parseInt(hash[0..7], 16) % 100   // 0-99
coin toss  = parseInt(hash[8..9], 16) % 2 === 0 ? "Heads" : "Tails"
```

Seed verification simply compares `SHA-256(revealedSeed)` against the committed server seed hash.

## Status semantics

| Status    | Meaning                                                        |
|-----------|----------------------------------------------------------------|
| `Verified` | `SHA-256(revealedSeed)` matches the commitment hash             |
| `Mismatch` | `SHA-256(revealedSeed)` does not match the commitment hash      |
| `Pending`  | Missing commitment or revealed seed — nothing to verify yet      |

## Accessibility

- Every input has a visible `<label>` tied via `htmlFor`/`id`.
- The results panel is a `role="status"` region with `aria-live="polite"` so screen readers
  announce verification changes.
- Status pills carry distinct text and color, never color alone.

## Testing

```bash
# From the repository root (Vitest + Testing Library)
npx vitest run experimental/ui/provable-fairness-verifier/ProvableFairnessVerifier.test.tsx
```

Covered scenarios:

- Valid seed match computes status as `"Verified"`.
- Mismatched seed computes status as `"Mismatch"`.
- Input field changes update verification output dynamically.
- Copy proof writes the verification summary to the clipboard.
- Pending state and accessible labels / aria-live regions.