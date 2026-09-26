# contract-auth-checker

CLI tool that parses Soroban simulated authorization trees
(`SorobanAuthorizationEntry`-shaped JSON, e.g. dumped from a
`simulateTransaction` RPC response) and reports the deep authorization
footprint of a transaction: which contracts get invoked, which addresses
authorize them, and where cross-contract authorization boundaries are
crossed.

## Usage

```bash
npm install
npm run build

contract-auth-checker --sim-result sim.json [--warn-cross-contract] [--json]
```

`sim.json` is either a raw array of auth entries or `{ "authEntries": [...] }`:

```json
[
  {
    "authorizer": "GALICE...",
    "rootInvocation": {
      "contract": "coin-flip",
      "functionName": "play",
      "subInvocations": [
        {
          "contract": "prize-pool",
          "functionName": "lock",
          "subInvocations": [
            { "contract": "token", "functionName": "transfer", "subInvocations": [] }
          ]
        }
      ]
    }
  }
]
```

## What it reports

- A terminal tree view of each authorization entry's invocation hierarchy.
- **Cross-contract calls**: every parent → child invocation where the
  contract changes.
- **Non-root authorizations**: entries signed by an address other than the
  transaction source account.
- **Privilege escalation risks**: cross-contract calls two or more hops away
  from the root invocation — authorization footprint the signer did not
  directly initiate and may not have reviewed.

`--warn-cross-contract` makes the process exit non-zero when any
cross-contract call is present (useful in CI to catch unexpectedly broad
authorization scopes). Privilege escalation risks always cause a non-zero
exit.

## Development

```bash
npm run dev -- --sim-result sim.json
npm test
```
