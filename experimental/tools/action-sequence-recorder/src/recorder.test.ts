import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  generateMockActions,
  createSession,
  compressSession,
  decompressSession,
  saveSessionToFile,
  loadSessionFromFile,
  type GameAction,
  type SessionFile,
} from './recorder.js';

describe('recorder', () => {
  describe('generateMockActions', () => {
    it('should generate the requested number of actions', () => {
      const actions = generateMockActions(10);
      expect(actions).toHaveLength(10);
    });

    it('should generate zero actions when count is 0', () => {
      const actions = generateMockActions(0);
      expect(actions).toHaveLength(0);
    });

    it('should produce actions with increasing timestamps', () => {
      const actions = generateMockActions(20);
      for (let i = 1; i < actions.length; i++) {
        expect(actions[i].timestamp).toBeGreaterThanOrEqual(actions[i - 1].timestamp);
      }
    });

    it('should have positive deltaMs for each action', () => {
      const actions = generateMockActions(15);
      for (const action of actions) {
        expect(action.deltaMs).toBeGreaterThan(0);
      }
    });

    it('should produce actions with valid types and payloads', () => {
      const actions = generateMockActions(30);
      for (const action of actions) {
        expect(typeof action.type).toBe('string');
        expect(action.type.length).toBeGreaterThan(0);
        expect(typeof action.payload).toBe('object');
        expect(action.payload).not.toBeNull();
      }
    });
  });

  describe('createSession', () => {
    it('should create a session with the correct game ID', () => {
      const actions = generateMockActions(5);
      const session = createSession('space-invaders', actions);
      expect(session.gameId).toBe('space-invaders');
    });

    it('should include recordedAt as an ISO string', () => {
      const actions = generateMockActions(3);
      const session = createSession('game-1', actions);
      expect(typeof session.recordedAt).toBe('string');
      expect(() => new Date(session.recordedAt)).not.toThrow();
    });

    it('should compute actionCount and totalDurationMs in metadata', () => {
      const actions = generateMockActions(8);
      const session = createSession('game-2', actions);
      expect(session.metadata.actionCount).toBe(8);
      expect(typeof session.metadata.totalDurationMs).toBe('number');
      expect(session.metadata.totalDurationMs).toBeGreaterThan(0);
    });

    it('should merge custom metadata', () => {
      const actions = generateMockActions(2);
      const session = createSession('game-3', actions, { difficulty: 'hard' });
      expect(session.metadata.difficulty).toBe('hard');
      expect(session.metadata.actionCount).toBe(2);
    });
  });

  describe('compressSession / decompressSession', () => {
    it('should roundtrip a session through compress and decompress', () => {
      const actions = generateMockActions(12);
      const session = createSession('roundtrip-test', actions);

      const compressed = compressSession(session);
      expect(Buffer.isBuffer(compressed)).toBe(true);
      expect(compressed.length).toBeGreaterThan(0);

      const decompressed = decompressSession(compressed);
      expect(decompressed.gameId).toBe(session.gameId);
      expect(decompressed.actions).toHaveLength(session.actions.length);
      expect(decompressed.recordedAt).toBe(session.recordedAt);
    });

    it('should produce smaller output than uncompressed JSON', () => {
      const actions = generateMockActions(100);
      const session = createSession('compression-test', actions);
      const uncompressed = Buffer.byteLength(JSON.stringify(session, null, 2));
      const compressed = compressSession(session);
      expect(compressed.length).toBeLessThan(uncompressed);
    });

    it('should preserve action data fidelity through roundtrip', () => {
      const actions = generateMockActions(5);
      const session = createSession('fidelity-test', actions);

      const decompressed = decompressSession(compressSession(session));
      for (let i = 0; i < actions.length; i++) {
        expect(decompressed.actions[i].type).toBe(actions[i].type);
        expect(decompressed.actions[i].payload).toEqual(actions[i].payload);
        expect(decompressed.actions[i].timestamp).toBe(actions[i].timestamp);
        expect(decompressed.actions[i].deltaMs).toBe(actions[i].deltaMs);
      }
    });
  });

  describe('saveSessionToFile / loadSessionFromFile', () => {
    const tmpDir = os.tmpdir();

    it('should save and load a session file', () => {
      const actions = generateMockActions(6);
      const session = createSession('file-test', actions);
      const filePath = path.join(tmpDir, `test-session-${Date.now()}.json.gz`);

      saveSessionToFile(session, filePath);
      expect(fs.existsSync(filePath)).toBe(true);

      const loaded = loadSessionFromFile(filePath);
      expect(loaded.gameId).toBe('file-test');
      expect(loaded.actions).toHaveLength(6);

      fs.unlinkSync(filePath);
    });

    it('should create parent directories if they do not exist', () => {
      const actions = generateMockActions(2);
      const session = createSession('dir-test', actions);
      const filePath = path.join(tmpDir, 'nested', 'dir', `session-${Date.now()}.json.gz`);

      saveSessionToFile(session, filePath);
      expect(fs.existsSync(filePath)).toBe(true);

      // clean up
      fs.unlinkSync(filePath);
      fs.rmdirSync(path.join(tmpDir, 'nested', 'dir'));
      fs.rmdirSync(path.join(tmpDir, 'nested'));
    });
  });

  describe('SessionFile structure', () => {
    it('should have all required fields', () => {
      const actions = generateMockActions(3);
      const session = createSession('struct-test', actions);

      const requiredKeys: (keyof SessionFile)[] = ['gameId', 'recordedAt', 'actions', 'metadata'];
      for (const key of requiredKeys) {
        expect(session).toHaveProperty(key);
      }
    });

    it('should have valid GameAction structure for each action', () => {
      const actions = generateMockActions(10);
      const session = createSession('struct-test-2', actions);

      for (const action of session.actions) {
        expect(typeof action.type).toBe('string');
        expect(typeof action.payload).toBe('object');
        expect(typeof action.timestamp).toBe('number');
        expect(typeof action.deltaMs).toBe('number');
      }
    });
  });
});
