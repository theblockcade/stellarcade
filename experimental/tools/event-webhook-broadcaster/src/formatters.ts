import type { DiscordEmbed, DiscordWebhookPayload, GameEvent } from './types';

const STELLAR_EXPERT_BASE = 'https://stellar.expert/explorer/public/contract';

const EVENT_LABELS: Record<GameEvent['type'], string> = {
  match_started: 'Match Started',
  wager_deposited: 'Wager Deposited',
  round_settled: 'Round Settled',
  jackpot_won: 'Jackpot Won!',
  tournament_final: 'Tournament Final',
  win_streak: 'Win Streak',
};

const EVENT_COLORS: Record<GameEvent['type'], number> = {
  match_started: 0x6366f1, // indigo
  wager_deposited: 0x0ea5e9, // sky
  round_settled: 0x64748b, // slate
  jackpot_won: 0xfbbf24, // amber
  tournament_final: 0xa855f7, // purple
  win_streak: 0xef4444, // red
};

function shortenAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Formats a game event into a rich Discord webhook embed payload: title,
 * color-coded by event type, key/value fields, and a link to the
 * contract on Stellar Expert.
 */
export function formatDiscordEmbed(event: GameEvent): DiscordWebhookPayload {
  const fields: DiscordEmbed['fields'] = [];

  if (event.player) {
    fields.push({ name: 'Player', value: shortenAddress(event.player), inline: true });
  }
  if (typeof event.wagerXlm === 'number') {
    fields.push({ name: 'Amount', value: `${event.wagerXlm.toLocaleString()} XLM`, inline: true });
  }
  if (typeof event.streakCount === 'number') {
    fields.push({ name: 'Streak', value: `${event.streakCount} wins`, inline: true });
  }
  fields.push({ name: 'Contract', value: shortenAddress(event.contractId), inline: true });

  const embed: DiscordEmbed = {
    title: EVENT_LABELS[event.type],
    color: EVENT_COLORS[event.type],
    fields,
    url: `${STELLAR_EXPERT_BASE}/${event.contractId}`,
    timestamp: event.timestamp,
  };

  return { embeds: [embed] };
}

/**
 * Formats a game event into a Telegram Bot API HTML message body. Telegram
 * HTML parse mode only supports a small tag subset (b, i, code, a, etc.) —
 * this sticks to bold and inline code, and escapes any user-controlled
 * text (player address) to avoid breaking the HTML parser.
 */
export function formatTelegramMessage(event: GameEvent): string {
  const lines: string[] = [`<b>${escapeHtml(EVENT_LABELS[event.type])}</b>`];

  if (event.player) {
    lines.push(`Player: <code>${escapeHtml(shortenAddress(event.player))}</code>`);
  }
  if (typeof event.wagerXlm === 'number') {
    lines.push(`Amount: <b>${event.wagerXlm.toLocaleString()} XLM</b>`);
  }
  if (typeof event.streakCount === 'number') {
    lines.push(`Streak: <b>${event.streakCount} wins</b>`);
  }
  lines.push(
    `Contract: <a href="${STELLAR_EXPERT_BASE}/${escapeHtml(event.contractId)}">${escapeHtml(
      shortenAddress(event.contractId),
    )}</a>`,
  );

  return lines.join('\n');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
