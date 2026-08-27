import { RejectedCallError } from './types';
import type { ContractFunctionSpec, FuzzTarget } from './types';

/**
 * A minimal in-memory reference model of a deposit/withdraw vault,
 * modeled after this repo's Soroban vault-style contracts (see
 * `contracts/asset-escrow-v3`, `contracts/token-vesting-linear`): users
 * deposit and withdraw an integer balance, and the contract's core
 * invariant is that the total vault balance always equals the sum of
 * individual user balances — exactly the example given in the issue
 * ("total vault balances must equal sum of user deposits").
 *
 * This target exists so `runFuzz` has something concrete to run against
 * in tests and the CLI's `--contract reference-vault` demo mode without
 * requiring a live Soroban RPC connection to a deployed contract (none
 * is available in this environment — see README Known Limitations).
 */
export interface VaultState {
  totalBalance: bigint;
  userBalances: Record<string, bigint>;
  /**
   * Set by an intentionally-seeded bug (see `allowNegativeWithdrawBug`)
   * so the fuzz engine has a real invariant violation to find in tests
   * and CLI demo runs, rather than only ever exercising the "no bugs
   * found" path.
   */
  buggyMode: boolean;
}

export const VAULT_FUNCTIONS: ContractFunctionSpec[] = [
  { name: 'deposit', params: [{ name: 'user', type: 'address' }, { name: 'amount', type: 'u128' }] },
  { name: 'withdraw', params: [{ name: 'user', type: 'address' }, { name: 'amount', type: 'u128' }] },
];

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  return 0n;
}

/**
 * Builds a reference vault target. When `buggyMode` is true, `withdraw`
 * has a seeded off-by-one bug (it allows withdrawing one unit more than
 * the user's balance without clamping), which the fuzzer should be able
 * to discover and report a minimal reproduction for — this is what the
 * "detects invariant violations" acceptance criterion is verified against
 * in `fuzzer.test.ts`.
 */
export function createReferenceVaultTarget(buggyMode = false): FuzzTarget<VaultState> {
  return {
    name: 'reference-vault',
    functions: VAULT_FUNCTIONS,
    initialState: () => ({ totalBalance: 0n, userBalances: {}, buggyMode }),
    apply: (state, call) => {
      const user = String(call.args.user);
      const amount = toBigInt(call.args.amount);
      const userBalances = { ...state.userBalances };
      const currentBalance = userBalances[user] ?? 0n;

      if (call.functionName === 'deposit') {
        if (amount < 0n) {
          // Expected guard rejection (like a real contract's
          // panic_with_error! on bad input) — not a fuzzing failure.
          throw new RejectedCallError('deposit amount must be non-negative');
        }
        userBalances[user] = currentBalance + amount;
        return { ...state, userBalances, totalBalance: state.totalBalance + amount };
      }

      if (call.functionName === 'withdraw') {
        if (amount < 0n) {
          throw new RejectedCallError('withdraw amount must be non-negative');
        }
        // Seeded bug: buggy mode allows a withdrawal of exactly
        // `currentBalance + 1` to slip through unclamped, corrupting the
        // total-vs-sum-of-balances invariant.
        const effectiveLimit = state.buggyMode ? currentBalance + 1n : currentBalance;
        if (amount > effectiveLimit) {
          // Also an expected guard rejection: the vault correctly refuses
          // to overdraw. Only the buggy target's off-by-one *slipping
          // through* (below) is a real invariant violation.
          throw new RejectedCallError(`insufficient balance: ${user} has ${currentBalance}, requested ${amount}`);
        }
        userBalances[user] = currentBalance - amount;
        return { ...state, userBalances, totalBalance: state.totalBalance - amount };
      }

      // An unrecognized function name is a real bug in the fuzz harness
      // wiring (the target declared a function it can't actually apply),
      // not an expected rejection — a plain Error correctly fails the run.
      throw new Error(`Unknown function: ${call.functionName}`);
    },
    checkInvariants: (state) => {
      const violations: string[] = [];
      const sumOfBalances = Object.values(state.userBalances).reduce((sum, b) => sum + b, 0n);

      if (sumOfBalances !== state.totalBalance) {
        violations.push(
          `total vault balance (${state.totalBalance}) does not equal sum of user balances (${sumOfBalances})`
        );
      }
      if (state.totalBalance < 0n) {
        violations.push(`total vault balance went negative: ${state.totalBalance}`);
      }
      for (const [user, balance] of Object.entries(state.userBalances)) {
        if (balance < 0n) {
          violations.push(`user ${user} balance went negative: ${balance}`);
        }
      }

      return violations;
    },
  };
}
