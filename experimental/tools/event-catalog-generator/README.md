# Event Catalog Generator

Scans Soroban contract Rust sources for emitted events and writes a Markdown catalog.

## CLI

```bash
npm install
npm run build
event-catalog-generator --contracts-dir ../../contracts/trivia-escrow/src --output EVENTS.md
```

## API

- `scanContractEvents(sourceCode: string): ContractEventDef[]`
- `generateMarkdownCatalog(events: ContractEventDef[]): string`

## Tests

```bash
npm test
```
