import type { CallGraphEdge, CallGraphReport, ContractCallCounts, ContractInfo } from './types';

/**
 * Builds the full report (isolated contracts + per-contract inward/outward
 * counts) from a set of discovered contracts and resolved call edges.
 */
export function buildCallGraphReport(contracts: ContractInfo[], edges: CallGraphEdge[]): CallGraphReport {
  const inward = new Map<string, number>();
  const outward = new Map<string, number>();
  for (const contract of contracts) {
    inward.set(contract.dirName, 0);
    outward.set(contract.dirName, 0);
  }

  for (const edge of edges) {
    outward.set(edge.caller, (outward.get(edge.caller) ?? 0) + 1);
    inward.set(edge.callee, (inward.get(edge.callee) ?? 0) + 1);
  }

  const callCounts: ContractCallCounts[] = contracts.map((c) => ({
    contract: c.dirName,
    inward: inward.get(c.dirName) ?? 0,
    outward: outward.get(c.dirName) ?? 0,
  }));

  const isolatedContracts = callCounts
    .filter((c) => c.inward === 0 && c.outward === 0)
    .map((c) => c.contract)
    .sort();

  return { contracts, edges, isolatedContracts, callCounts };
}

/** A Mermaid-safe node id: Mermaid identifiers can't contain hyphens unescaped, so they're replaced. */
function toMermaidId(dirName: string): string {
  return dirName.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Renders the call graph as a Mermaid `flowchart` (top-down). Isolated
 * contracts are still emitted as standalone nodes so the diagram
 * reflects every discovered contract, not just ones with edges — this
 * is what lets the "highlight isolated contracts" acceptance criterion
 * work visually (they render but have no connecting arrows).
 */
export function renderMermaid(report: CallGraphReport): string {
  const lines: string[] = ['flowchart TD'];

  for (const contract of report.contracts) {
    lines.push(`    ${toMermaidId(contract.dirName)}["${contract.dirName}"]`);
  }

  for (const edge of report.edges) {
    const callCount = edge.callSites.length;
    const label = callCount > 1 ? `|${callCount} calls|` : '';
    lines.push(`    ${toMermaidId(edge.caller)} -->${label} ${toMermaidId(edge.callee)}`);
  }

  if (report.isolatedContracts.length > 0) {
    lines.push('');
    lines.push('    %% Isolated contracts (no cross-contract calls detected)');
    for (const dirName of report.isolatedContracts) {
      lines.push(`    style ${toMermaidId(dirName)} stroke-dasharray: 5 5`);
    }
  }

  return lines.join('\n');
}

/** A DOT-safe node id, quoted so hyphens in directory names are preserved verbatim. */
function toDotId(dirName: string): string {
  return `"${dirName.replace(/"/g, '\\"')}"`;
}

/**
 * Renders the call graph as Graphviz DOT source. Isolated contracts are
 * rendered as dashed-outline nodes so `dot -Tsvg` output visually
 * distinguishes them without needing a separate legend.
 */
export function renderDot(report: CallGraphReport): string {
  const lines: string[] = ['digraph CallGraph {', '    rankdir=TD;'];

  const isolatedSet = new Set(report.isolatedContracts);
  for (const contract of report.contracts) {
    const id = toDotId(contract.dirName);
    if (isolatedSet.has(contract.dirName)) {
      lines.push(`    ${id} [style=dashed];`);
    } else {
      lines.push(`    ${id};`);
    }
  }

  for (const edge of report.edges) {
    const callCount = edge.callSites.length;
    const label = callCount > 1 ? ` [label="${callCount} calls"]` : '';
    lines.push(`    ${toDotId(edge.caller)} -> ${toDotId(edge.callee)}${label};`);
  }

  lines.push('}');
  return lines.join('\n');
}

export function render(report: CallGraphReport, format: 'mermaid' | 'dot'): string {
  return format === 'dot' ? renderDot(report) : renderMermaid(report);
}

/** Renders the inward/outward call count summary as a Markdown table. */
export function renderSummaryTable(report: CallGraphReport): string {
  const lines: string[] = ['| Contract | Inward Calls | Outward Calls |', '|---|---|---|'];
  for (const row of report.callCounts) {
    lines.push(`| ${row.contract} | ${row.inward} | ${row.outward} |`);
  }
  return lines.join('\n');
}
