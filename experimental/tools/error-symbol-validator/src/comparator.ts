import type { ErrorSymbol, SdkMapping, Discrepancy } from './types';

export class SymbolComparator {
  private contractSymbols: ErrorSymbol[];
  private sdkMappings: SdkMapping[];

  constructor(contractSymbols: ErrorSymbol[], sdkMappings: SdkMapping[]) {
    this.contractSymbols = contractSymbols;
    this.sdkMappings = sdkMappings;
  }

  compare(): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];
    discrepancies.push(...this.findMissingInSdk());
    discrepancies.push(...this.findMissingInContract());
    discrepancies.push(...this.findMessageMismatches());
    return discrepancies;
  }

  findMissingInSdk(): Discrepancy[] {
    const sdkSymbolSet = new Set(this.sdkMappings.map(m => m.symbol));
    return this.contractSymbols
      .filter(cs => !sdkSymbolSet.has(cs.symbol))
      .map(cs => ({
        symbol: cs.symbol,
        status: 'missing_in_sdk' as const,
        contractSource: cs.source,
      }));
  }

  findMissingInContract(): Discrepancy[] {
    const contractSymbolSet = new Set(this.contractSymbols.map(cs => cs.symbol));
    return this.sdkMappings
      .filter(sm => !contractSymbolSet.has(sm.symbol))
      .map(sm => ({
        symbol: sm.symbol,
        status: 'missing_in_contract' as const,
        sdkSource: sm.source,
      }));
  }

  findMessageMismatches(): Discrepancy[] {
    const sdkMap = new Map(this.sdkMappings.map(m => [m.symbol, m]));
    const contractMap = new Map(this.contractSymbols.map(cs => [cs.symbol, cs]));
    const mismatches: Discrepancy[] = [];

    for (const [symbol, contractEntry] of contractMap) {
      const sdkEntry = sdkMap.get(symbol);
      if (!sdkEntry) continue;
      const contractMsg = this.inferContractMessage(contractEntry);
      if (contractMsg && sdkEntry.message !== contractMsg) {
        mismatches.push({
          symbol,
          status: 'message_mismatch',
          contractSource: contractEntry.source,
          sdkSource: sdkEntry.source,
          contractMessage: contractMsg,
          sdkMessage: sdkEntry.message,
        });
      }
    }

    return mismatches;
  }

  getSummary(): { total: number; matched: number; mismatched: number } {
    const discrepancies = this.compare();
    const allContractSymbols = new Set(this.contractSymbols.map(cs => cs.symbol));
    const allSdkSymbols = new Set(this.sdkMappings.map(sm => sm.symbol));
    const matched = [...allContractSymbols].filter(s => allSdkSymbols.has(s)).length;
    const total = new Set([...allContractSymbols, ...allSdkSymbols]).size;
    return {
      total,
      matched,
      mismatched: discrepancies.length,
    };
  }

  exportMarkdown(): string {
    const discrepancies = this.compare();
    const discrepancyMap = new Map(discrepancies.map(d => [d.symbol, d]));
    const allSymbols = new Set([
      ...this.contractSymbols.map(cs => cs.symbol),
      ...this.sdkMappings.map(sm => sm.symbol),
    ]);

    const lines: string[] = [];
    lines.push('# Error Symbol Validation Report');
    lines.push('');
    lines.push('| Symbol | Status | Contract Source | SDK Source |');
    lines.push('|--------|--------|-----------------|------------|');

    const sorted = [...allSymbols].sort();
    for (const symbol of sorted) {
      const disc = discrepancyMap.get(symbol);
      const contractEntry = this.contractSymbols.find(cs => cs.symbol === symbol);
      const sdkEntry = this.sdkMappings.find(sm => sm.symbol === symbol);
      const contractSrc = contractEntry ? `${contractEntry.source}:${contractEntry.lineNumber}` : '-';
      const sdkSrc = sdkEntry ? `${sdkEntry.source}:${sdkEntry.lineNumber}` : '-';
      const status = disc ? disc.status : 'matched';
      lines.push(`| ${symbol} | ${status} | ${contractSrc} | ${sdkSrc} |`);
    }

    lines.push('');
    lines.push(`**Total:** ${allSymbols.size} symbols | **Matched:** ${allSymbols.size - discrepancies.length} | **Discrepancies:** ${discrepancies.length}`);
    return lines.join('\n');
  }

  private inferContractMessage(entry: ErrorSymbol): string | null {
    return entry.type === 'enum_variant' ? entry.symbol.split('::').pop() || null : null;
  }
}
