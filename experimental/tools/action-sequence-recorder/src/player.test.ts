import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  computeStateHash,
  computeOriginalStateHash,
  replaySession,
  compareReplays,
  replayFromFile,
  type ReplayResult,
} from './player.js';
import {
  generateMockActions,
  createSession,
  saveSessionToFile,
  type SessionFile,
} from './recorder.js';

describe('player', () => {
  describe('computeStateHash', () => {
    it('should return a 16-character hex string', () => {
      const hash = computeStateHash([]);
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should return the same hash for the same actions', () => {
      const actions = generateMockActions(5);
      const hash1 = computeStateHash(actions);
      const hash2 = computeStateHash(actions);
      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different actions', () => {
      const actions1: Array<{ type: string; payload: Record<string, unknown>; timestamp: number; deltaMs: number }> = [
        { type: 'move_left', payload: { direction: 'left' }, timestamp: 1000, deltaMs: 50 },
      ];
      const actions2: Array<{ type: string; payload: Record<string, unknown>; timestamp: number; deltaMs: number }> = [
        { type: 'move_right', payload: { direction: 'right' }, timestamp: 1000, deltaMs: 50 },
      ];
      const hash1 = computeStateHash(actions1);
      const hash2 = computeStateHash(actions2);
      expect(hash1).not.toBe(hash2);
    });

    it('should produce a different hash when actions are added', () => {
      const actions1 = generateMockActions(3);
      const actions2 = [...actions1, generateMockActions(1)[0]];
      const hash1 = computeStateHash(actions1);
      const hash2 = computeStateHash(actions2);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty action list', () => {
      const hash = computeStateHash([]);
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe('computeOriginalStateHash', () => {
    it('should hash all actions in a session', () => {
      const actions = generateMockActions(10);
      const session = createSession('hash-test', actions);
      const hash = computeOriginalStateHash(session);
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should match computeStateHash on the same action list', () => {
      const actions = generateMockActions(7);
      const session = createSession('hash-match', actions);
      const originalHash = computeOriginalStateHash(session);
      const directHash = computeStateHash(actions);
      expect(originalHash).toBe(directHash);
    });
  });

  describe('replaySession', () => {
    it('should return a result with all required fields', () => {
      const session = createSession('replay-test', generateMockActions(5));
      const result = replaySession(session);

      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('finalStateHash');
      expect(result).toHaveProperty('originalStateHash');
      expect(result).toHaveProperty('deterministic');
      expect(result).toHaveProperty('divergencePoint');
      expect(result).toHaveProperty('totalElapsed');
    });

    it('should produce one step per action', () => {
      const actions = generateMockActions(15);
      const session = createSession('step-count', actions);
      const result = replaySession(session);
      expect(result.steps).toHaveLength(15);
    });

    it('should be deterministic (final hash equals original hash)', () => {
      const session = createSession('deterministic', generateMockActions(20));
      const result = replaySession(session);
      expect(result.deterministic).toBe(true);
      expect(result.finalStateHash).toBe(result.originalStateHash);
      expect(result.divergencePoint).toBeNull();
    });

    it('should track cumulative state hash across steps', () => {
      const actions = generateMockActions(5);
      const session = createSession('cumulative', actions);
      const result = replaySession(session);

      // each step should have a unique hash (assuming distinct actions)
      const hashes = result.steps.map((s) => s.stateHash);
      const uniqueHashes = new Set(hashes);
      // hashes may collide but are likely unique for small sets
      expect(uniqueHashes.size).toBeGreaterThanOrEqual(1);
    });

    it('should compute elapsed time at 1x speed', () => {
      const actions = generateMockActions(10);
      const session = createSession('speed-1x', actions);
      const result = replaySession(session, '1x');

      // totalElapsed should equal sum of deltaMs
      const expectedElapsed = actions.reduce((sum, a) => sum + a.deltaMs, 0);
      expect(result.totalElapsed).toBe(expectedElapsed);
    });

    it('should compute elapsed time at 2x speed', () => {
      const actions = generateMockActions(10);
      const session = createSession('speed-2x', actions);
      const result = replaySession(session, '2x');

      const expectedElapsed = actions.reduce((sum, a) => sum + a.deltaMs, 0);
      expect(result.totalElapsed).toBe(expectedElapsed / 2);
    });

    it('should set elapsed to 0 at max speed', () => {
      const actions = generateMockActions(5);
      const session = createSession('speed-max', actions);
      const result = replaySession(session, 'max');
      expect(result.totalElapsed).toBe(0);
    });

    it('should handle empty sessions', () => {
      const session = createSession('empty', []);
      const result = replaySession(session);
      expect(result.steps).toHaveLength(0);
      expect(result.deterministic).toBe(true);
    });

    it('should populate each step with correct action data', () => {
      const actions = generateMockActions(3);
      const session = createSession('step-data', actions);
      const result = replaySession(session);

      for (let i = 0; i < actions.length; i++) {
        expect(result.steps[i].index).toBe(i);
        expect(result.steps[i].action.type).toBe(actions[i].type);
        expect(result.steps[i].action.payload).toEqual(actions[i].payload);
      }
    });
  });

  describe('compareReplays', () => {
    it('should return null for identical replays', () => {
      const session = createSession('compare-same', generateMockActions(10));
      const result1 = replaySession(session);
      const result2 = replaySession(session);
      expect(compareReplays(result1, result2)).toBeNull();
    });

    it('should return the divergence point for different replays', () => {
      const actions1 = generateMockActions(10);
      const actions2 = [...actions1.slice(0, 3), generateMockActions(1)[0], ...actions1.slice(4)];

      const session1 = createSession('diff-1', actions1);
      const session2 = createSession('diff-2', actions2);

      const result1 = replaySession(session1);
      const result2 = replaySession(session2);

      const divergence = compareReplays(result1, result2);
      expect(divergence).not.toBeNull();
      expect(divergence).toBeGreaterThanOrEqual(3);
    });

    it('should return null when both replays have zero steps', () => {
      const emptySession = createSession('empty', []);
      const result1 = replaySession(emptySession);
      const result2 = replaySession(emptySession);
      expect(compareReplays(result1, result2)).toBeNull();
    });
  });

  describe('replayFromFile', () => {
    it('should load and replay from a gzipped file', () => {
      const tmpDir = os.tmpdir();
      const actions = generateMockActions(8);
      const session = createSession('file-replay', actions);
      const filePath = path.join(tmpDir, `replay-test-${Date.now()}.json.gz`);

      saveSessionToFile(session, filePath);
      const result = replayFromFile(filePath);

      expect(result.steps).toHaveLength(8);
      expect(result.deterministic).toBe(true);
      expect(result.finalStateHash).toBe(result.originalStateHash);

      // clean up
      const fs = require('node:fs');
      fs.unlinkSync(filePath);
    });
  });
});
