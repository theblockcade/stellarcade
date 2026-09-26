# Prediction Market Dispute Escrow

Experimental Soroban contract for oracle outcome reporting, challenge windows, and arbiter resolution.

## Flow

1. `report_outcome` — oracle posts outcome and bond; challenge deadline is set.
2. `challenge_outcome` — optional counter-bond during the window.
3. `finalize_undisputed` — after the window if no challenge.
4. `arbitrate` — admin/arbiter resolves disputed markets.
5. `claim_resolution_payout` — winner claims escrowed bonds.

## Tests

```bash
cargo test
```
