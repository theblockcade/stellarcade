import * as fs from 'fs';
import * as path from 'path';
import type { ErrorSymbol } from './types';

export class SymbolExtractor {
  private contractsDir: string;

  constructor(contractsDir: string) {
    this.contractsDir = contractsDir;
  }

  extractAll(): ErrorSymbol[] {
    const results: ErrorSymbol[] = [];
    const files = this.findRsFiles(this.contractsDir);
    for (const file of files) {
      results.push(...this.extractFromFile(file));
    }
    return results;
  }

  extractFromFile(filePath: string): ErrorSymbol[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const results: ErrorSymbol[] = [];
    results.push(...this.extractSymbolNewPatterns(content, filePath));
    results.push(...this.extractContractErrors(content, filePath));
    results.push(...this.extractPanicWithError(content, filePath));
    return results;
  }

  extractSymbolNewPatterns(content: string, filePath: string): ErrorSymbol[] {
    const results: ErrorSymbol[] = [];
    const regex = /Symbol::new\s*\(\s*&\s*env\s*,\s*"([^"]+)"\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      results.push({
        symbol: match[1],
        source: filePath,
        lineNumber: this.getLineNumber(content, match.index),
        type: 'symbol',
      });
    }
    return results;
  }

  extractContractErrors(content: string, filePath: string): ErrorSymbol[] {
    const results: ErrorSymbol[] = [];
    const enumRegex = /#\[contracterror\]/g;
    let match: RegExpExecArray | null;
    while ((match = enumRegex.exec(content)) !== null) {
      const anchorIndex = match.index;
      const afterAnchor = content.slice(anchorIndex);
      const enumDeclMatch = afterAnchor.match(/pub\s+enum\s+(\w+)/);
      if (!enumDeclMatch) continue;
      const enumName = enumDeclMatch[1];
      const enumDeclIndex = content.indexOf(enumDeclMatch[0], anchorIndex);
      const bodyStart = content.indexOf('{', enumDeclIndex);
      if (bodyStart === -1) continue;
      const braceDepth = this.findClosingBrace(content, bodyStart);
      if (braceDepth === -1) continue;
      const body = content.slice(bodyStart + 1, braceDepth);
      const lines = body.split('\n');
      let lineOffset = content.slice(0, bodyStart + 1).split('\n').length;
      for (const line of lines) {
        const trimmed = line.trim();
        const variantMatch = trimmed.match(/^(\w+)\s*(?:=\s*\d+)?[,:]?\s*$/);
        if (variantMatch) {
          results.push({
            symbol: `${enumName}::${variantMatch[1]}`,
            source: filePath,
            lineNumber: lineOffset,
            type: 'contract_error',
          });
        }
        lineOffset++;
      }
    }
    return results;
  }

  extractPanicWithError(content: string, filePath: string): ErrorSymbol[] {
    const results: ErrorSymbol[] = [];
    const regex = /panic_with_error!\s*\(\s*&\s*env\s*,\s*([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const rawArg = match[1].trim();
      let symbol: string | null = null;
      const stringLiteral = rawArg.match(/^"([^"]+)"$/);
      if (stringLiteral) {
        symbol = stringLiteral[1];
      } else {
        const pathMatch = rawArg.match(/(\w+::\w+)/);
        if (pathMatch) {
          symbol = pathMatch[1];
        } else {
          const identMatch = rawArg.match(/^(\w+)$/);
          if (identMatch) symbol = identMatch[1];
        }
      }
      if (!symbol) continue;
      results.push({
        symbol,
        source: filePath,
        lineNumber: this.getLineNumber(content, match.index),
        type: 'enum_variant',
      });
    }
    return results;
  }

  getLineNumber(content: string, matchIndex: number): number {
    let line = 1;
    for (let i = 0; i < matchIndex && i < content.length; i++) {
      if (content[i] === '\n') {
        line++;
      }
    }
    return line;
  }

  private findRsFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(entry.parentPath ?? entry.path, entry.name);
      if (entry.name.endsWith('.rs')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  private findClosingBrace(content: string, openIndex: number): number {
    let depth = 0;
    for (let i = openIndex; i < content.length; i++) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }
}
