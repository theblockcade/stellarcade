import { describe, it, expect } from 'vitest';
import { EmbedBuilder } from './embed-builder';
import type { MatchResult } from './types';

const baseMatch: MatchResult = {
  matchId: 'match-abc-123',
  gameType: 'Cosmic Racer',
  player1: { handle: 'player1', score: 100, won: true },
  player2: { handle: 'player2', score: 80, won: false },
  wagerAmount: 50,
  netPayout: 95,
  isJackpot: false,
  isTournament: false,
  settledAt: '2026-08-26T12:00:00.000Z',
  explorerUrl: 'https://explorer.stellarcade.io/match/match-abc-123',
};

describe('EmbedBuilder', () => {
  const builder = new EmbedBuilder();

  describe('buildMatchAnnouncement', () => {
    it('produces a valid embed structure for a normal match', () => {
      const embed = builder.buildMatchAnnouncement(baseMatch);

      expect(embed.title).toBe('Match Result');
      expect(embed.description).toContain('player1');
      expect(embed.description).toContain('player2');
      expect(embed.color).toBe(0x3498DB);
      expect(embed.fields.length).toBeGreaterThanOrEqual(5);
      expect(embed.footer?.text).toBe('StellarCade Match Explorer');
      expect(embed.timestamp).toBe(baseMatch.settledAt);
    });

    it('assigns green color for high payout matches', () => {
      const match: MatchResult = { ...baseMatch, netPayout: 1500 };
      const embed = builder.buildMatchAnnouncement(match);
      expect(embed.color).toBe(0x00FF00);
    });

    it('assigns purple color for jackpot wins', () => {
      const match: MatchResult = { ...baseMatch, isJackpot: true };
      const embed = builder.buildMatchAnnouncement(match);
      expect(embed.color).toBe(0x9B59B6);
    });

    it('assigns gold color for tournament finals', () => {
      const match: MatchResult = { ...baseMatch, isTournament: true };
      const embed = builder.buildMatchAnnouncement(match);
      expect(embed.color).toBe(0xFFD700);
    });

    it('assigns default blue color for normal matches', () => {
      const embed = builder.buildMatchAnnouncement(baseMatch);
      expect(embed.color).toBe(0x3498DB);
    });

    it('highlights the winner in the description', () => {
      const embed = builder.buildMatchAnnouncement(baseMatch);
      expect(embed.description).toContain('**player1**');
      expect(embed.description).toContain('defeats');
    });

    it('includes all required fields', () => {
      const embed = builder.buildMatchAnnouncement(baseMatch);
      const fieldNames = embed.fields.map((f) => f.name);

      expect(fieldNames).toContain('Game Type');
      expect(fieldNames).toContain('Players');
      expect(fieldNames).toContain('Score');
      expect(fieldNames).toContain('Wager');
      expect(fieldNames).toContain('Net Payout');
      expect(fieldNames).toContain('Match ID');
    });

    it('uses jackpot title for jackpot matches', () => {
      const match: MatchResult = { ...baseMatch, isJackpot: true };
      const embed = builder.buildMatchAnnouncement(match);
      expect(embed.title).toBe('Jackpot Win!');
    });

    it('uses tournament title for tournament finals', () => {
      const match: MatchResult = { ...baseMatch, isTournament: true };
      const embed = builder.buildMatchAnnouncement(match);
      expect(embed.title).toBe('Tournament Final Result');
    });
  });

  describe('shouldAnnounce', () => {
    it('returns true when wager meets minimum threshold', () => {
      expect(builder.shouldAnnounce(baseMatch, 50)).toBe(true);
    });

    it('returns true when wager exceeds minimum threshold', () => {
      expect(builder.shouldAnnounce(baseMatch, 10)).toBe(true);
    });

    it('returns false when wager is below minimum threshold', () => {
      expect(builder.shouldAnnounce(baseMatch, 100)).toBe(false);
    });

    it('returns true when wager equals zero and minimum is zero', () => {
      const match: MatchResult = { ...baseMatch, wagerAmount: 0 };
      expect(builder.shouldAnnounce(match, 0)).toBe(true);
    });

    it('returns false when wager is zero and minimum is positive', () => {
      const match: MatchResult = { ...baseMatch, wagerAmount: 0 };
      expect(builder.shouldAnnounce(match, 1)).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('formats whole numbers with two decimal places', () => {
      expect(builder.formatCurrency(100)).toBe('100.00 XLM');
    });

    it('formats decimals correctly', () => {
      expect(builder.formatCurrency(1234.56)).toBe('1,234.56 XLM');
    });

    it('formats zero', () => {
      expect(builder.formatCurrency(0)).toBe('0.00 XLM');
    });

    it('formats large numbers with comma separators', () => {
      expect(builder.formatCurrency(1000000)).toBe('1,000,000.00 XLM');
    });

    it('formats small decimals', () => {
      expect(builder.formatCurrency(0.5)).toBe('0.50 XLM');
    });
  });
});
