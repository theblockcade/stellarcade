import type { DiscordEmbed, MatchResult } from './types';

const COLOR_HIGH_PAYOUT = 0x00FF00;
const COLOR_JACKPOT = 0x9B59B6;
const COLOR_TOURNAMENT = 0xFFD700;
const COLOR_DEFAULT = 0x3498DB;

export class EmbedBuilder {
  buildMatchAnnouncement(match: MatchResult): DiscordEmbed {
    const color = this.getColor(match);
    const winner = match.player1.won ? match.player1 : match.player2;
    const loser = match.player1.won ? match.player2 : match.player1;

    const title = this.getTitle(match);

    const description = `**${winner.handle}** defeats **${loser.handle}**`;

    const fields = [
      { name: 'Game Type', value: match.gameType, inline: true },
      { name: 'Players', value: `${winner.handle} vs ${loser.handle}`, inline: true },
      { name: 'Score', value: `${match.player1.score} - ${match.player2.score}`, inline: true },
      { name: 'Wager', value: this.formatCurrency(match.wagerAmount), inline: true },
      { name: 'Net Payout', value: this.formatCurrency(match.netPayout), inline: true },
      { name: 'Match ID', value: match.matchId, inline: false },
    ];

    return {
      title,
      description,
      color,
      fields,
      footer: { text: 'StellarCade Match Explorer' },
      timestamp: match.settledAt,
    };
  }

  formatCurrency(amount: number): string {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} XLM`;
  }

  shouldAnnounce(match: MatchResult, minWager: number): boolean {
    return match.wagerAmount >= minWager;
  }

  private getColor(match: MatchResult): number {
    if (match.isJackpot) {
      return COLOR_JACKPOT;
    }
    if (match.isTournament) {
      return COLOR_TOURNAMENT;
    }
    if (match.netPayout > 1000) {
      return COLOR_HIGH_PAYOUT;
    }
    return COLOR_DEFAULT;
  }

  private getTitle(match: MatchResult): string {
    if (match.isJackpot) {
      return 'Jackpot Win!';
    }
    if (match.isTournament) {
      return 'Tournament Final Result';
    }
    return 'Match Result';
  }
}
