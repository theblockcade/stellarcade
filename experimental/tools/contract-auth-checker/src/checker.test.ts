import { describe, it, expect } from 'vitest';
import {
  parseAuthEntries,
  analyzeAuthEntries,
  findCrossContractCalls,
  renderAuthTree,
} from './checker';
import type { AuthEntry } from '../types';

const multiLevelEntry: AuthEntry = {
  authorizer: 'GALICE',
  rootInvocation: {
    contract: 'coin-flip',
    functionName: 'play',
    subInvocations: [
      {
        contract: 'prize-pool',
        functionName: 'lock',
        subInvocations: [
          {
            contract: 'token',
            functionName: 'transfer',
            subInvocations: [],
          },
        ],
      },
      {
        contract: 'random-generator',
        functionName: 'roll',
        subInvocations: [],
      },
    ],
  },
};

describe('parseAuthEntries', () => {
  it('parses a raw array of entries and fills in defaults', () => {
    const parsed = parseAuthEntries([multiLevelEntry]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].rootInvocation.subInvocations).toHaveLength(2);
  });

  it('parses an object wrapper with an authEntries field', () => {
    const parsed = parseAuthEntries({ authEntries: [multiLevelEntry] });
    expect(parsed).toHaveLength(1);
  });

  it('defaults a missing authorizer to sourceAccount', () => {
    const [parsed] = parseAuthEntries([
      { rootInvocation: { contract: 'c', functionName: 'f', subInvocations: [] } },
    ]);
    expect(parsed.authorizer).toBe('sourceAccount');
  });

  it('throws on malformed input', () => {
    expect(() => parseAuthEntries({ notEntries: [] })).toThrow();
    expect(() => parseAuthEntries([{ rootInvocation: {} }])).toThrow();
  });
});

describe('multi-level authorization tree parsing', () => {
  it('parses nested sub-invocations at multiple depths', () => {
    const [entry] = parseAuthEntries([multiLevelEntry]);
    expect(entry.rootInvocation.subInvocations?.[0].subInvocations?.[0].contract).toBe('token');
  });
});

describe('cross-contract call detection', () => {
  it('detects every parent -> child contract boundary crossing', () => {
    const calls = findCrossContractCalls(multiLevelEntry.rootInvocation);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fromContract: 'coin-flip', toContract: 'prize-pool', depth: 1 }),
        expect.objectContaining({ fromContract: 'prize-pool', toContract: 'token', depth: 2 }),
        expect.objectContaining({ fromContract: 'coin-flip', toContract: 'random-generator', depth: 1 }),
      ])
    );
  });

  it('reports no cross-contract calls for a single-contract tree', () => {
    const single = {
      authorizer: 'sourceAccount',
      rootInvocation: { contract: 'access-control', functionName: 'grant', subInvocations: [] },
    };
    const calls = findCrossContractCalls(single.rootInvocation);
    expect(calls).toHaveLength(0);
  });
});

describe('privilege escalation risk detection', () => {
  it('flags cross-contract calls two or more hops from the root', () => {
    const diagnostics = analyzeAuthEntries([multiLevelEntry]);
    expect(diagnostics.privilegeEscalationRisks.length).toBeGreaterThan(0);
    expect(diagnostics.privilegeEscalationRisks[0].contract).toBe('token');
  });

  it('does not flag a flat one-hop authorization', () => {
    const flat: AuthEntry = {
      authorizer: 'GBOB',
      rootInvocation: {
        contract: 'access-control',
        functionName: 'grant',
        subInvocations: [{ contract: 'token', functionName: 'transfer', subInvocations: [] }],
      },
    };
    const diagnostics = analyzeAuthEntries([flat]);
    expect(diagnostics.privilegeEscalationRisks).toHaveLength(0);
  });
});

describe('tree view formatting', () => {
  it('renders a hierarchical tree with contract.function labels', () => {
    const output = renderAuthTree(multiLevelEntry);
    expect(output).toContain('Authorizer: GALICE');
    expect(output).toContain('coin-flip.play()');
    expect(output).toContain('prize-pool.lock()');
    expect(output).toContain('token.transfer()');
    expect(output).toMatch(/[├└]/);
  });
});
