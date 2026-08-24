import { describe, it, expect } from 'vitest';
import {
  emitMatchStarted,
  emitWagerDeposited,
  emitRoundSettled,
  emitJackpotWon,
  emitEvent,
} from './emitters';
import type { EventType } from './types';

describe('Event Emitters', () => {
  const contractId = 'test_contract_id';

  describe('emitMatchStarted', () => {
    it('should emit a match_started event with default payload', () => {
      const event = emitMatchStarted(contractId, false);
      
      expect(event.type).toBe('match_started');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.matchId).toBeDefined();
      expect(event.payload.player.publicKey).toBeDefined();
      expect(event.payload.wager.amount).toBe('100.00');
      expect(event.payload.wager.asset).toBe('XLM');
      expect(event.payload.gameType).toBe('coin-flip');
    });

    it('should emit a match_started event with random payload', () => {
      const event = emitMatchStarted(contractId, true);
      
      expect(event.type).toBe('match_started');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.matchId).toBeDefined();
      expect(event.payload.player.publicKey).toBeDefined();
      expect(event.payload.wager.amount).not.toBe('100.00');
      expect(event.payload.gameType).toBeDefined();
    });
  });

  describe('emitWagerDeposited', () => {
    it('should emit a wager_deposited event with default payload', () => {
      const event = emitWagerDeposited(contractId, false);
      
      expect(event.type).toBe('wager_deposited');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.matchId).toBeDefined();
      expect(event.payload.player.publicKey).toBeDefined();
      expect(event.payload.amount.amount).toBe('100.00');
      expect(event.payload.timestamp).toBeDefined();
    });

    it('should emit a wager_deposited event with random payload', () => {
      const event = emitWagerDeposited(contractId, true);
      
      expect(event.type).toBe('wager_deposited');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.amount.amount).not.toBe('100.00');
    });
  });

  describe('emitRoundSettled', () => {
    it('should emit a round_settled event with default payload', () => {
      const event = emitRoundSettled(contractId, false);
      
      expect(event.type).toBe('round_settled');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.matchId).toBeDefined();
      expect(event.payload.winner.publicKey).toBeDefined();
      expect(event.payload.loser.publicKey).toBeDefined();
      expect(event.payload.result).toBe('win');
      expect(event.payload.payout.amount).toBe('100.00');
    });

    it('should emit a round_settled event with random payload', () => {
      const event = emitRoundSettled(contractId, true);
      
      expect(event.type).toBe('round_settled');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.result).toBeDefined();
      expect(event.payload.payout.amount).not.toBe('100.00');
    });
  });

  describe('emitJackpotWon', () => {
    it('should emit a jackpot_won event with default payload', () => {
      const event = emitJackpotWon(contractId, false);
      
      expect(event.type).toBe('jackpot_won');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.matchId).toBeDefined();
      expect(event.payload.winner.publicKey).toBeDefined();
      expect(event.payload.jackpotAmount.amount).toBe('5000.00');
      expect(event.payload.jackpotAmount.asset).toBe('XLM');
      expect(event.payload.totalPlayers).toBe(50);
    });

    it('should emit a jackpot_won event with random payload', () => {
      const event = emitJackpotWon(contractId, true);
      
      expect(event.type).toBe('jackpot_won');
      expect(event.contractId).toBe(contractId);
      expect(event.payload.jackpotAmount.amount).not.toBe('5000.00');
      expect(event.payload.totalPlayers).toBeGreaterThan(0);
    });
  });

  describe('emitEvent', () => {
    it('should emit correct event type for match_started', () => {
      const event = emitEvent('match_started', contractId, false);
      expect(event.type).toBe('match_started');
    });

    it('should emit correct event type for wager_deposited', () => {
      const event = emitEvent('wager_deposited', contractId, false);
      expect(event.type).toBe('wager_deposited');
    });

    it('should emit correct event type for round_settled', () => {
      const event = emitEvent('round_settled', contractId, false);
      expect(event.type).toBe('round_settled');
    });

    it('should emit correct event type for jackpot_won', () => {
      const event = emitEvent('jackpot_won', contractId, false);
      expect(event.type).toBe('jackpot_won');
    });

    it('should throw error for unknown event type', () => {
      expect(() => emitEvent('unknown' as EventType, contractId, false)).toThrow(
        'Unknown event type: unknown'
      );
    });
  });

  describe('Event Structure', () => {
    it('should have timestamp in ISO format', () => {
      const event = emitMatchStarted(contractId, false);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should have unique match IDs', () => {
      const event1 = emitMatchStarted(contractId, false);
      const event2 = emitMatchStarted(contractId, false);
      expect(event1.payload.matchId).not.toBe(event2.payload.matchId);
    });

    it('should have valid Stellar public key format', () => {
      const event = emitMatchStarted(contractId, false);
      expect(event.payload.player.publicKey).toMatch(/^G[A-Z2-7]{55}$/);
    });
  });
});