import { describe, it, expect } from 'vitest';
import { generateMarkdownCatalog, scanContractEvents } from './extractor';

const SAMPLE = `
#[contractevent]
pub struct RoundCreated {
    #[topic]
    pub round_id: u64,
    pub host: Address,
    pub entry_fee: i128,
}

CommitmentSubmitted { round_id, player }.publish(&env);

env.events().publish((Symbol::new(&env, "round_started"), player), payload);
`;

describe('scanContractEvents', () => {
  it('extracts standard Soroban event signatures from sample Rust', () => {
    const events = scanContractEvents(SAMPLE);
    expect(events.some((e) => e.name === 'RoundCreated')).toBe(true);
    const round = events.find((e) => e.name === 'RoundCreated')!;
    expect(round.topics).toContain('round_id: u64');
    expect(round.fields.some((f) => f.name === 'host')).toBe(true);
    expect(events.some((e) => e.name === 'CommitmentSubmitted')).toBe(true);
    expect(events.some((e) => e.name === 'round_started')).toBe(true);
  });

  it('generates Markdown tables for single and multiple events', () => {
    const events = scanContractEvents(SAMPLE);
    const md = generateMarkdownCatalog(events);
    expect(md).toContain('# Contract Event Catalog');
    expect(md).toContain('## RoundCreated');
    expect(md).toContain('| Field | Type | Topic |');
    expect(md).toContain('## CommitmentSubmitted');
  });

  it('handles contracts with no events emitted', () => {
    const md = generateMarkdownCatalog(scanContractEvents('fn foo() {}'));
    expect(md).toContain('_No events emitted');
  });
});
