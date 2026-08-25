import { describe, it, expect } from 'vitest';
import { formatDiscordEmbed, formatTelegramMessage } from './formatters';
import type { GameEvent } from './types';

const jackpotEvent: GameEvent = {
  type: 'jackpot_won',
  timestamp: '2026-08-24T12:00:00.000Z',
  contractId: 'CABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQR',
  player: 'GABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJKLMNOPQR',
  wagerXlm: 250.5,
};

describe('formatDiscordEmbed', () => {
  it('produces a valid Discord embed payload structure', () => {
    const payload = formatDiscordEmbed(jackpotEvent);

    expect(payload.embeds).toHaveLength(1);
    const embed = payload.embeds[0];
    expect(embed.title).toBe('Jackpot Won!');
    expect(embed.timestamp).toBe(jackpotEvent.timestamp);
    expect(embed.color).toBeTypeOf('number');
    expect(embed.url).toContain(jackpotEvent.contractId);
  });

  it('includes player and amount fields when present', () => {
    const payload = formatDiscordEmbed(jackpotEvent);
    const fieldNames = payload.embeds[0].fields.map((f) => f.name);

    expect(fieldNames).toContain('Player');
    expect(fieldNames).toContain('Amount');
    const amountField = payload.embeds[0].fields.find((f) => f.name === 'Amount');
    expect(amountField?.value).toContain('250.5');
  });

  it('omits player/amount/streak fields when absent', () => {
    const minimal: GameEvent = {
      type: 'match_started',
      timestamp: '2026-08-24T12:00:00.000Z',
      contractId: 'CABC',
    };
    const payload = formatDiscordEmbed(minimal);
    const fieldNames = payload.embeds[0].fields.map((f) => f.name);

    expect(fieldNames).not.toContain('Player');
    expect(fieldNames).not.toContain('Amount');
    expect(fieldNames).not.toContain('Streak');
    expect(fieldNames).toContain('Contract');
  });

  it('assigns a distinct color per event type', () => {
    const jackpot = formatDiscordEmbed({ ...jackpotEvent, type: 'jackpot_won' });
    const started = formatDiscordEmbed({ ...jackpotEvent, type: 'match_started' });
    expect(jackpot.embeds[0].color).not.toBe(started.embeds[0].color);
  });

  it('shortens long addresses for display', () => {
    const payload = formatDiscordEmbed(jackpotEvent);
    const playerField = payload.embeds[0].fields.find((f) => f.name === 'Player');
    expect(playerField?.value.length).toBeLessThan(jackpotEvent.player!.length);
    expect(playerField?.value).toContain('…');
  });

  it('includes streak count for win_streak events', () => {
    const streakEvent: GameEvent = { ...jackpotEvent, type: 'win_streak', streakCount: 7 };
    const payload = formatDiscordEmbed(streakEvent);
    const streakField = payload.embeds[0].fields.find((f) => f.name === 'Streak');
    expect(streakField?.value).toBe('7 wins');
  });
});

describe('formatTelegramMessage', () => {
  it('produces valid Telegram HTML with bold title and fields', () => {
    const message = formatTelegramMessage(jackpotEvent);

    expect(message).toContain('<b>Jackpot Won!</b>');
    expect(message).toContain('250.5 XLM');
    expect(message).toContain('<a href=');
  });

  it('escapes HTML special characters in contract id', () => {
    const withSpecialChars: GameEvent = {
      ...jackpotEvent,
      contractId: 'C<script>alert(1)</script>',
    };
    const message = formatTelegramMessage(withSpecialChars);

    expect(message).not.toContain('<script>');
    expect(message).toContain('&lt;script&gt;');
  });

  it('omits optional lines when the corresponding data is absent', () => {
    const minimal: GameEvent = {
      type: 'round_settled',
      timestamp: '2026-08-24T12:00:00.000Z',
      contractId: 'CABC',
    };
    const message = formatTelegramMessage(minimal);

    expect(message).not.toContain('Player:');
    expect(message).not.toContain('Amount:');
    expect(message).not.toContain('Streak:');
  });
});
