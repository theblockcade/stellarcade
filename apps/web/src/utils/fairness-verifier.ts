/**
 * Client-side cryptographic verification algorithms for StellarCade provable fairness.
 * Runs in all modern browsers and Node (using WebCrypto).
 */

export interface VerificationInput {
  serverSeed: string;
  commitHash?: string;
  clientSeed: string;
  nonce: string | number;
  ledgerHash: string;
  rangeSize?: number;
  claimedDerivedValue?: string;
}

export interface VerificationStepResult {
  step: string;
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
}

export interface FairnessVerificationOutcome {
  isValid: boolean;
  recomputedCommitHash: string;
  commitmentMatch: boolean;
  entropyMaterial: string;
  derivedHex: string;
  derivedValueBigInt: string;
  mappedOutcome: number;
  gameLabel: string;
  steps: VerificationStepResult[];
  error?: string;
}

export function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

export function mapToRange(value: bigint, size: number): number {
  if (size <= 0) {
    throw new Error(`Invalid outcome range size: ${size}`);
  }
  return Number(value % BigInt(size));
}

export function formatGameOutcomeLabel(outcome: number, rangeSize: number): string {
  if (rangeSize === 2) {
    return outcome === 0 ? "Heads (0)" : "Tails (1)";
  }
  if (rangeSize === 6) {
    return `Die Face: ${outcome + 1} (Raw index: ${outcome})`;
  }
  if (rangeSize === 100) {
    return `Lucky Number: ${outcome + 1}`;
  }
  return `Outcome Index: ${outcome} (of ${rangeSize})`;
}

export async function verifyFairnessProof(
  input: VerificationInput
): Promise<FairnessVerificationOutcome> {
  const steps: VerificationStepResult[] = [];
  const rangeSize = input.rangeSize && input.rangeSize > 0 ? input.rangeSize : 2;

  try {
    // 1. Recompute Server Seed Commitment Hash
    const recomputedCommitHash = await sha256Hex(input.serverSeed.trim());
    const expectedCommit = input.commitHash?.trim().toLowerCase() || "";
    const actualCommit = recomputedCommitHash.toLowerCase();

    let commitmentMatch = true;
    if (expectedCommit) {
      commitmentMatch = expectedCommit === actualCommit;
      steps.push({
        step: "Server Seed Commitment Hash Verification",
        passed: commitmentMatch,
        expected: expectedCommit,
        actual: actualCommit,
        details: commitmentMatch
          ? "SHA-256 of revealed serverSeed exactly matches the pre-committed hash."
          : "MISMATCH: The revealed serverSeed does not produce the published commit hash. The server altered its seed after the bet was placed!",
      });
    } else {
      steps.push({
        step: "Server Seed Commitment Hash Verification",
        passed: true,
        expected: "N/A (No pre-commitment provided)",
        actual: actualCommit,
        details: "Computed commitment hash from revealed serverSeed.",
      });
    }

    // 2. Derive Pseudo-Random Outcome
    const normalizedNonce = String(input.nonce).trim();
    const entropyMaterial = `${input.serverSeed.trim()}:${input.clientSeed.trim()}:${normalizedNonce}:${input.ledgerHash.trim()}`;
    const derivedHex = await sha256Hex(entropyMaterial);
    const derivedValue = BigInt(`0x${derivedHex}`);
    const mappedOutcome = mapToRange(derivedValue, rangeSize);

    // 3. Claimed Value Check (if supplied)
    if (input.claimedDerivedValue) {
      const expectedClaim = input.claimedDerivedValue.trim().toLowerCase();
      const claimedMatch = expectedClaim === derivedHex.toLowerCase();
      steps.push({
        step: "Derived Value Verification",
        passed: claimedMatch,
        expected: expectedClaim,
        actual: derivedHex,
        details: claimedMatch
          ? "Derived outcome digest matches claimed proof value."
          : "MISMATCH: Derived digest does not match claimed proof value.",
      });
    } else {
      steps.push({
        step: "Outcome Derivation",
        passed: true,
        expected: `SHA256(serverSeed:clientSeed:nonce:ledgerHash)`,
        actual: derivedHex,
        details: `Successfully derived 256-bit entropy digest and mapped to range size ${rangeSize}.`,
      });
    }

    const overallValid = steps.every((s) => s.passed);

    return {
      isValid: overallValid,
      recomputedCommitHash,
      commitmentMatch,
      entropyMaterial,
      derivedHex,
      derivedValueBigInt: derivedValue.toString(),
      mappedOutcome,
      gameLabel: formatGameOutcomeLabel(mappedOutcome, rangeSize),
      steps,
    };
  } catch (err: any) {
    return {
      isValid: false,
      recomputedCommitHash: "",
      commitmentMatch: false,
      entropyMaterial: "",
      derivedHex: "",
      derivedValueBigInt: "0",
      mappedOutcome: 0,
      gameLabel: "Error",
      steps,
      error: err?.message || "Verification failed due to invalid inputs.",
    };
  }
}

export interface TestVectorPreset {
  id: string;
  name: string;
  description: string;
  gameType: "coin-flip" | "dice-roll" | "number-guess";
  input: VerificationInput;
}

export const FAIRNESS_TEST_VECTORS: TestVectorPreset[] = [
  {
    id: "coin-flip-pass",
    name: "Valid Coin Flip Round (Tails)",
    description: "Standard verified coin flip round with valid commitment hash matching Tails outcome.",
    gameType: "coin-flip",
    input: {
      serverSeed: "d9e87b92f1a63c8e41209b55f8492049d98a00281b37492c10a45372810f27bc",
      commitHash: "944758309926dd1117cce77cb2bd507598796b6bc2b59f9ee0b424b936f7ee4d",
      clientSeed: "stellar_player_alpha_921",
      nonce: "42",
      ledgerHash: "4b6c317db66a1e50f55b184232230198de7e5ecfef3cf89d46f5c5d012e8bc19",
      rangeSize: 2,
    },
  },
  {
    id: "dice-roll-pass",
    name: "Valid Dice Roll Round (Range 6)",
    description: "Dice roll game verified against ledger hash and revealed entropy.",
    gameType: "dice-roll",
    input: {
      serverSeed: "5f4dcc3b5aa765d61d8327deb882cf992b9699aabbccddeeff00112233445566",
      commitHash: "dc19d0d575ff919813e885c8dd2df83486c90148854a42fa2354be57f141dbe3",
      clientSeed: "high_roller_lucky_777",
      nonce: "108",
      ledgerHash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
      rangeSize: 6,
    },
  },
  {
    id: "tampered-commit-fail",
    name: "Tampered Server Seed (Invalid Proof)",
    description: "Demonstrates detection of a manipulated server seed that doesn't match the pre-commitment hash.",
    gameType: "coin-flip",
    input: {
      serverSeed: "tampered_server_seed_changed_after_bet_placed",
      commitHash: "944758309926dd1117cce77cb2bd507598796b6bc2b59f9ee0b424b936f7ee4d",
      clientSeed: "player_seed_unmodified",
      nonce: "1",
      ledgerHash: "4b6c317db66a1e50f55b184232230198de7e5ecfef3cf89d46f5c5d012e8bc19",
      rangeSize: 2,
    },
  },
];
