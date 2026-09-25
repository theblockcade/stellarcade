export type VerificationStatus = 'verified' | 'mismatch' | 'pending';

export interface GameOutcome {
  roll: number;
  coin: 'Heads' | 'Tails';
}

export interface VerificationSummary {
  serverSeedHash: string;
  revealedSeed: string;
  clientSeed: string;
  nonce: number;
  computedHash: string;
  status: VerificationStatus;
  outcome: GameOutcome | null;
}

export interface ProvableFairnessVerifierProps {
  initialServerSeedHash?: string;
  initialRevealedSeed?: string;
  initialClientSeed?: string;
  initialNonce?: number;
  onVerify?: (result: VerificationSummary) => void;
  testId?: string;
}