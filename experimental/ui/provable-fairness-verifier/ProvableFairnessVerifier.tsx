'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GameOutcome,
  ProvableFairnessVerifierProps,
  VerificationStatus,
  VerificationSummary,
} from './types';
import './ProvableFairnessVerifier.css';

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return ((x >>> n) | (x << (32 - n))) | 0;
}

export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const l1 = bytes.length + 1;
  const zeroPad = (64 - ((l1 + 8) % 64)) % 64;
  const paddedLen = l1 + zeroPad + 8;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(paddedLen - 8, Math.floor(bitLength / 0x100000000));
  dv.setUint32(paddedLen - 4, bitLength >>> 0);

  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a,
    h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let off = 0; off < paddedLen; off += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getUint32(off + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + s1 + ch + SHA256_K[i] + w[i]) | 0;
      const s0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
}

export function verifySeed(serverSeedHash: string, revealedSeed: string): VerificationStatus {
  if (!revealedSeed || !serverSeedHash) {
    return 'pending';
  }
  const computed = sha256Hex(revealedSeed).toLowerCase();
  const expected = serverSeedHash.trim().toLowerCase();
  return computed === expected ? 'verified' : 'mismatch';
}

export function computeOutcome(
  revealedSeed: string,
  clientSeed: string,
  nonce: number,
): GameOutcome | null {
  if (!revealedSeed || !clientSeed || nonce < 0) {
    return null;
  }
  const hash = sha256Hex(`${revealedSeed}:${clientSeed}:${nonce}`);
  const roll = parseInt(hash.slice(0, 8), 16) % 100;
  const coin = parseInt(hash.slice(8, 10), 16) % 2 === 0 ? 'Heads' : 'Tails';
  return { roll, coin };
}

const STATUS_LABEL: Record<VerificationStatus, string> = {
  verified: 'Verified',
  mismatch: 'Mismatch',
  pending: 'Pending',
};

export const ProvableFairnessVerifier: React.FC<ProvableFairnessVerifierProps> = ({
  initialServerSeedHash = '',
  initialRevealedSeed = '',
  initialClientSeed = '',
  initialNonce = 0,
  onVerify,
  testId = 'provable-fairness-verifier',
}) => {
  const [serverSeedHash, setServerSeedHash] = useState(initialServerSeedHash);
  const [revealedSeed, setRevealedSeed] = useState(initialRevealedSeed);
  const [clientSeed, setClientSeed] = useState(initialClientSeed);
  const [nonceInput, setNonceInput] = useState(String(initialNonce));
  const [copied, setCopied] = useState(false);
  const lastEmittedKeyRef = useRef('');

  const nonce = useMemo(() => {
    const parsed = parseInt(nonceInput, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [nonceInput]);

  const status = useMemo(
    () => verifySeed(serverSeedHash, revealedSeed),
    [serverSeedHash, revealedSeed],
  );

  const computedHash = useMemo(
    () => (revealedSeed ? sha256Hex(revealedSeed) : ''),
    [revealedSeed],
  );

  const outcome = useMemo(
    () => computeOutcome(revealedSeed, clientSeed, nonce),
    [revealedSeed, clientSeed, nonce],
  );

  const summary = useMemo<VerificationSummary>(
    () => ({
      serverSeedHash,
      revealedSeed,
      clientSeed,
      nonce,
      computedHash,
      status,
      outcome,
    }),
    [serverSeedHash, revealedSeed, clientSeed, nonce, computedHash, status, outcome],
  );

  const emitKey = useMemo(
    () => `${status}|${serverSeedHash}|${revealedSeed}|${clientSeed}|${nonce}`,
    [status, serverSeedHash, revealedSeed, clientSeed, nonce],
  );

  useEffect(() => {
    if (onVerify && lastEmittedKeyRef.current !== emitKey) {
      lastEmittedKeyRef.current = emitKey;
      onVerify(summary);
    }
  }, [emitKey, onVerify, summary]);

  const buildProofText = useCallback((): string => {
    return [
      'StellarCade — Provable Fairness Verification',
      `Server Seed Hash (Commitment): ${serverSeedHash || '(empty)'}`,
      `Revealed Server Seed: ${revealedSeed || '(empty)'}`,
      `Client Seed: ${clientSeed || '(empty)'}`,
      `Nonce: ${nonce}`,
      `Computed SHA-256: ${computedHash || '(empty)'}`,
      `Status: ${STATUS_LABEL[status]}`,
      outcome ? `Outcome: Dice roll ${outcome.roll}, Coin toss ${outcome.coin}` : 'Outcome: pending',
    ].join('\n');
  }, [serverSeedHash, revealedSeed, clientSeed, nonce, computedHash, status, outcome]);

  const handleCopyProof = useCallback(async () => {
    const text = buildProofText();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [buildProofText]);

  return (
    <div className="provable-fairness-verifier" data-testid={testId}>
      <h2 className="provable-fairness-verifier__title">Provable Fairness Verifier</h2>
      <p className="provable-fairness-verifier__subtitle">
        Verify server seed commitments and compute provable game outcomes entirely in your browser.
      </p>

      <div className="provable-fairness-verifier__fields">
        <div className="provable-fairness-verifier__field">
          <label className="provable-fairness-verifier__label" htmlFor={`${testId}-seed-hash`}>
            Server Seed Hash (Commitment)
          </label>
          <input
            id={`${testId}-seed-hash`}
            className="provable-fairness-verifier__input"
            type="text"
            value={serverSeedHash}
            onChange={(event) => setServerSeedHash(event.target.value)}
            placeholder="hex hash committed before the round"
            spellCheck={false}
          />
        </div>

        <div className="provable-fairness-verifier__field">
          <label className="provable-fairness-verifier__label" htmlFor={`${testId}-revealed-seed`}>
            Revealed Server Seed
          </label>
          <input
            id={`${testId}-revealed-seed`}
            className="provable-fairness-verifier__input"
            type="text"
            value={revealedSeed}
            onChange={(event) => setRevealedSeed(event.target.value)}
            placeholder="secret seed revealed after the round"
            spellCheck={false}
          />
        </div>

        <div className="provable-fairness-verifier__field">
          <label className="provable-fairness-verifier__label" htmlFor={`${testId}-client-seed`}>
            Client Seed
          </label>
          <input
            id={`${testId}-client-seed`}
            className="provable-fairness-verifier__input"
            type="text"
            value={clientSeed}
            onChange={(event) => setClientSeed(event.target.value)}
            placeholder="seed chosen by the player"
            spellCheck={false}
          />
        </div>

        <div className="provable-fairness-verifier__field">
          <label className="provable-fairness-verifier__label" htmlFor={`${testId}-nonce`}>
            Nonce
          </label>
          <input
            id={`${testId}-nonce`}
            className="provable-fairness-verifier__input"
            type="number"
            min={0}
            step={1}
            value={nonceInput}
            onChange={(event) => setNonceInput(event.target.value)}
            placeholder="round play count"
          />
        </div>
      </div>

      <div
        className="provable-fairness-verifier__results"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="provable-fairness-verifier__status-row">
          <span
            className={`provable-fairness-verifier__status-pill provable-fairness-verifier__status-pill--${status}`}
            data-testid={`${testId}-status`}
          >
            {STATUS_LABEL[status]}
          </span>
          <span className="provable-fairness-verifier__status-detail">
            {status === 'verified'
              ? 'SHA-256 of the revealed seed matches the commitment.'
              : status === 'mismatch'
                ? 'SHA-256 of the revealed seed does NOT match the commitment.'
                : 'Enter a commitment and revealed seed to verify.'}
          </span>
        </div>

        <div className="provable-fairness-verifier__outcome" data-testid={`${testId}-outcome`}>
          <div className="provable-fairness-verifier__outcome-item">
            <span className="provable-fairness-verifier__outcome-label">Dice Roll (0-99)</span>
            <span className="provable-fairness-verifier__outcome-value">
              {outcome ? outcome.roll : '—'}
            </span>
          </div>
          <div className="provable-fairness-verifier__outcome-item">
            <span className="provable-fairness-verifier__outcome-label">Coin Toss</span>
            <span className="provable-fairness-verifier__outcome-value">
              {outcome ? outcome.coin : '—'}
            </span>
          </div>
        </div>

        <div className="provable-fairness-verifier__hash">
          <span className="provable-fairness-verifier__hash-label">Computed SHA-256</span>
          <code className="provable-fairness-verifier__hash-value" data-testid={`${testId}-hash`}>
            {computedHash || '—'}
          </code>
        </div>
      </div>

      <div className="provable-fairness-verifier__actions">
        <button
          type="button"
          className="provable-fairness-verifier__copy"
          onClick={handleCopyProof}
          data-testid={`${testId}-copy`}
        >
          {copied ? 'Copied!' : 'Copy Verification Proof'}
        </button>
      </div>
    </div>
  );
};

ProvableFairnessVerifier.displayName = 'ProvableFairnessVerifier';
export default ProvableFairnessVerifier;