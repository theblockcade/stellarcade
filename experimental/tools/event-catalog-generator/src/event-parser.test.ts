import { describe, it, expect } from 'vitest';
import { parseEvents } from './event-parser';

describe('parseEvents', () => {
  it('extracts a Symbol::new topic and identifier data fields from a simple publish call', () => {
    const source = `
      pub fn place_wager(env: Env, player: Address, amount: i128) {
          env.events().publish((Symbol::new(&env, "wager_placed"), player.clone()), amount);
      }
    `;
    const events = parseEvents(source, 'lib.rs');

    expect(events).toHaveLength(1);
    expect(events[0].topics).toEqual(['wager_placed', 'player.clone()']);
  });

  it('extracts a symbol_short! topic', () => {
    const source = `
      env.events().publish((symbol_short!("gg"),), winner);
    `;
    const events = parseEvents(source, 'lib.rs');
    expect(events[0].topics).toEqual(['gg']);
  });

  it('extracts multiple topics from a tuple', () => {
    const source = `
      env.events().publish(
          (Symbol::new(&env, "transfer"), Symbol::new(&env, "completed")),
          (from, to, amount)
      );
    `;
    const events = parseEvents(source, 'lib.rs');
    expect(events[0].topics).toEqual(['transfer', 'completed']);
  });

  it('infers positional data field names from a tuple of bare identifiers', () => {
    const source = `
      env.events().publish((Symbol::new(&env, "deposit"),), (depositor, amount));
    `;
    const events = parseEvents(source, 'lib.rs');
    expect(events[0].dataFields).toEqual([
      { name: 'depositor', type: 'unknown' },
      { name: 'amount', type: 'unknown' },
    ]);
  });

  it('infers a typed data field from an `as` cast expression', () => {
    const source = `
      env.events().publish((Symbol::new(&env, "score"),), (points as i128));
    `;
    const events = parseEvents(source, 'lib.rs');
    expect(events[0].dataFields).toEqual([{ name: 'points', type: 'i128' }]);
  });

  it('handles a single non-tuple data expression', () => {
    const source = `
      env.events().publish((Symbol::new(&env, "counter_incremented"),), new_count);
    `;
    const events = parseEvents(source, 'lib.rs');
    expect(events[0].dataFields).toEqual([{ name: 'new_count', type: 'unknown' }]);
  });

  it('finds multiple publish calls across a file with correct line numbers', () => {
    const source = [
      'pub fn a(env: Env) {',
      '    env.events().publish((Symbol::new(&env, "a_event"),), 1i128);',
      '}',
      '',
      'pub fn b(env: Env) {',
      '    env.events().publish((Symbol::new(&env, "b_event"),), 2i128);',
      '}',
    ].join('\n');
    const events = parseEvents(source, 'lib.rs');

    expect(events).toHaveLength(2);
    expect(events[0].topics).toEqual(['a_event']);
    expect(events[0].line).toBe(2);
    expect(events[1].topics).toEqual(['b_event']);
    expect(events[1].line).toBe(6);
  });

  it('does not truncate on nested parens inside the call', () => {
    const source = `
      env.events().publish((Symbol::new(&env, "wrapped"),), compute(a, b, (c + d)));
    `;
    const events = parseEvents(source, 'lib.rs');
    expect(events).toHaveLength(1);
    expect(events[0].rawCall).toContain('compute(a, b, (c + d))');
  });

  it('returns an empty list for source with no publish calls', () => {
    const source = `pub fn noop(env: Env) {}`;
    expect(parseEvents(source, 'lib.rs')).toEqual([]);
  });

  it('preserves an unrecognized topic expression as raw text rather than dropping it', () => {
    const source = `
      env.events().publish((dynamic_topic_symbol,), payload);
    `;
    const events = parseEvents(source, 'lib.rs');
    expect(events[0].topics).toEqual(['dynamic_topic_symbol']);
  });
});
