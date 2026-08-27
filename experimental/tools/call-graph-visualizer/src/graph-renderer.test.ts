import { describe, it, expect } from 'vitest';
import { buildCallGraphReport, render, renderDot, renderMermaid, renderSummaryTable } from './graph-renderer';
import type { CallGraphEdge, ContractInfo } from './types';

const contracts: ContractInfo[] = [
  { dirName: 'coin-flip', structName: 'CoinFlip', path: '/x/coin-flip' },
  { dirName: 'random-generator', structName: 'RandomGenerator', path: '/x/random-generator' },
  { dirName: 'standalone-vault', structName: 'StandaloneVault', path: '/x/standalone-vault' },
];

const edges: CallGraphEdge[] = [
  {
    caller: 'coin-flip',
    callee: 'random-generator',
    callSites: [
      { clientName: 'RandomGeneratorClient', file: 'src/lib.rs', line: 12 },
      { clientName: 'RandomGeneratorClient', file: 'src/lib.rs', line: 40 },
    ],
  },
];

describe('buildCallGraphReport', () => {
  it('computes inward/outward counts per contract', () => {
    const report = buildCallGraphReport(contracts, edges);

    expect(report.callCounts).toEqual([
      { contract: 'coin-flip', inward: 0, outward: 1 },
      { contract: 'random-generator', inward: 1, outward: 0 },
      { contract: 'standalone-vault', inward: 0, outward: 0 },
    ]);
  });

  it('identifies contracts with zero inward and zero outward calls as isolated', () => {
    const report = buildCallGraphReport(contracts, edges);
    expect(report.isolatedContracts).toEqual(['standalone-vault']);
  });

  it('reports no isolated contracts when every contract has at least one edge', () => {
    const twoNode = contracts.slice(0, 2);
    const report = buildCallGraphReport(twoNode, edges);
    expect(report.isolatedContracts).toEqual([]);
  });

  it('handles an empty contract list gracefully', () => {
    const report = buildCallGraphReport([], []);
    expect(report.callCounts).toEqual([]);
    expect(report.isolatedContracts).toEqual([]);
  });
});

describe('renderMermaid', () => {
  it('emits a flowchart node for every contract', () => {
    const report = buildCallGraphReport(contracts, edges);
    const diagram = renderMermaid(report);

    expect(diagram).toContain('flowchart TD');
    expect(diagram).toContain('coin_flip["coin-flip"]');
    expect(diagram).toContain('random_generator["random-generator"]');
    expect(diagram).toContain('standalone_vault["standalone-vault"]');
  });

  it('emits an edge arrow for each call graph edge', () => {
    const report = buildCallGraphReport(contracts, edges);
    const diagram = renderMermaid(report);
    expect(diagram).toMatch(/coin_flip -->\|2 calls\| random_generator/);
  });

  it('omits the call-count label for a single call site', () => {
    const singleCallEdges: CallGraphEdge[] = [
      { caller: 'coin-flip', callee: 'random-generator', callSites: [{ clientName: 'RandomGeneratorClient', file: 'src/lib.rs', line: 1 }] },
    ];
    const report = buildCallGraphReport(contracts, singleCallEdges);
    const diagram = renderMermaid(report);
    expect(diagram).toContain('coin_flip --> random_generator');
  });

  it('marks isolated contracts with a dashed style directive', () => {
    const report = buildCallGraphReport(contracts, edges);
    const diagram = renderMermaid(report);
    expect(diagram).toContain('style standalone_vault stroke-dasharray: 5 5');
  });

  it('produces syntactically plausible mermaid output with no unmatched brackets', () => {
    const report = buildCallGraphReport(contracts, edges);
    const diagram = renderMermaid(report);
    const opens = (diagram.match(/\[/g) ?? []).length;
    const closes = (diagram.match(/\]/g) ?? []).length;
    expect(opens).toBe(closes);
  });
});

describe('renderDot', () => {
  it('emits a quoted node declaration for every contract', () => {
    const report = buildCallGraphReport(contracts, edges);
    const diagram = renderDot(report);

    expect(diagram).toContain('digraph CallGraph {');
    expect(diagram).toContain('"coin-flip";');
    expect(diagram).toContain('"random-generator";');
  });

  it('marks isolated contracts as dashed', () => {
    const report = buildCallGraphReport(contracts, edges);
    const diagram = renderDot(report);
    expect(diagram).toContain('"standalone-vault" [style=dashed];');
  });

  it('emits a labeled edge with the call count', () => {
    const report = buildCallGraphReport(contracts, edges);
    const diagram = renderDot(report);
    expect(diagram).toContain('"coin-flip" -> "random-generator" [label="2 calls"];');
  });
});

describe('render', () => {
  it('dispatches to renderMermaid for format "mermaid"', () => {
    const report = buildCallGraphReport(contracts, edges);
    expect(render(report, 'mermaid')).toBe(renderMermaid(report));
  });

  it('dispatches to renderDot for format "dot"', () => {
    const report = buildCallGraphReport(contracts, edges);
    expect(render(report, 'dot')).toBe(renderDot(report));
  });
});

describe('renderSummaryTable', () => {
  it('renders a markdown table with one row per contract', () => {
    const report = buildCallGraphReport(contracts, edges);
    const table = renderSummaryTable(report);

    expect(table).toContain('| Contract | Inward Calls | Outward Calls |');
    expect(table).toContain('| coin-flip | 0 | 1 |');
    expect(table).toContain('| random-generator | 1 | 0 |');
    expect(table).toContain('| standalone-vault | 0 | 0 |');
  });
});
