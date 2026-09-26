import { describe, it, expect } from 'vitest';
import { ActionRecorder } from './recorder';
import { createScoreArcadeEngine, validateReplaySession } from './replay-validator';

describe('ActionRecorder', () => {
  it('records multi-step sequence and serializes to JSON', () => {
    const recorder = new ActionRecorder({
      matchId: 'm-1',
      gameType: 'pong',
      playerAddress: 'GPLAYER',
      seedCommitment: 'abc123',
    });
    recorder.recordAction('score', { points: 10 }, 1000);
    recorder.recordAction('score', { points: 5 }, 1050);

    const engine = createScoreArcadeEngine();
    let state = engine.initialState('abc123');
    state = engine.applyAction(state, 'score', { points: 10 });
    state = engine.applyAction(state, 'score', { points: 5 });
    const session = recorder.exportSession(engine.outcomeHash(state));

    const json = JSON.stringify(session);
    const parsed = JSON.parse(json);
    expect(parsed.actions).toHaveLength(2);
    expect(parsed.actions[1].timestampDelta).toBe(50);
    expect(parsed.matchId).toBe('m-1');
  });

  it('validates unaltered replay logs', () => {
    const recorder = new ActionRecorder({
      matchId: 'm-2',
      gameType: 'breakout',
      playerAddress: 'GPLAYER',
      seedCommitment: 'seed',
    });
    recorder.recordAction('score', { points: 3 }, 2000);
    const engine = createScoreArcadeEngine();
    let state = engine.initialState('seed');
    state = engine.applyAction(state, 'score', { points: 3 });
    const session = recorder.exportSession(engine.outcomeHash(state));
    const result = validateReplaySession(session, engine);
    expect(result.valid).toBe(true);
  });

  it('rejects tampered payloads and invalid timestamps', () => {
    const recorder = new ActionRecorder({
      matchId: 'm-3',
      gameType: 'breakout',
      playerAddress: 'GPLAYER',
      seedCommitment: 'seed',
    });
    recorder.recordAction('score', { points: 3 }, 3000);
    const engine = createScoreArcadeEngine();
    let state = engine.initialState('seed');
    state = engine.applyAction(state, 'score', { points: 3 });
    const session = recorder.exportSession(engine.outcomeHash(state));
    session.actions[0].payload = { points: 999 };
    const tampered = validateReplaySession(session, engine);
    expect(tampered.valid).toBe(false);

    session.actions[0].payload = { points: 3 };
    session.actions[0].timestampDelta = -1;
    const badTime = validateReplaySession(session, engine);
    expect(badTime.valid).toBe(false);
    expect(badTime.diagnostics.some((d) => d.includes('timestampDelta'))).toBe(true);
  });
});
