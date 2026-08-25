import chalk from 'chalk';
import type { MatchRecord, ReplayStep } from './types';

/**
 * Pure step-cursor logic, separated from terminal I/O so it can be unit
 * tested without a TTY. `currentIndex` is always clamped to
 * `[0, steps.length - 1]`.
 */
export class ReplayCursor {
  private index = 0;

  constructor(private readonly steps: ReplayStep[]) {
    if (steps.length === 0) {
      throw new Error('ReplayCursor requires at least one step (the initial state)');
    }
  }

  get current(): ReplayStep {
    return this.steps[this.index];
  }

  get currentIndex(): number {
    return this.index;
  }

  /** Highest valid step index (i.e. the index of the final/settled step). */
  get lastIndex(): number {
    return this.steps.length - 1;
  }

  get isAtStart(): boolean {
    return this.index === 0;
  }

  get isAtEnd(): boolean {
    return this.index === this.steps.length - 1;
  }

  next(): ReplayStep {
    this.index = Math.min(this.index + 1, this.steps.length - 1);
    return this.current;
  }

  previous(): ReplayStep {
    this.index = Math.max(this.index - 1, 0);
    return this.current;
  }

  jumpToEnd(): ReplayStep {
    this.index = this.steps.length - 1;
    return this.current;
  }

  jumpToStart(): ReplayStep {
    this.index = 0;
    return this.current;
  }
}

/**
 * Renders one frame of the replay: match metadata header, the board
 * rendering for the current step, and a footer summarizing the outcome
 * once the cursor has reached the final step of a finalized match.
 */
export function renderFrame(record: MatchRecord, cursor: ReplayCursor): string {
  const lines: string[] = [];
  lines.push(chalk.bold.cyan(`Match ${record.matchId}`) + chalk.gray(`  (${record.gameType})`));
  lines.push(chalk.gray(`Players: ${record.players.join(', ') || 'unknown'}`));
  lines.push(chalk.gray(`Wager: ${record.wagerXlm} XLM`));
  lines.push('');
  lines.push(chalk.yellow(`Step ${cursor.currentIndex}/${cursor.lastIndex}`));
  lines.push('');
  lines.push(cursor.current.render);
  lines.push('');

  if (cursor.isAtEnd) {
    if (record.outcome) {
      lines.push(chalk.green.bold(`Winner: ${record.outcome.winner}`));
      lines.push(chalk.gray(`Settled: ${record.outcome.settledAt}`));
    } else {
      lines.push(chalk.yellow('Match not yet finalized — this is the latest known state.'));
    }
  }

  lines.push('');
  lines.push(chalk.gray('[→/space] next  [←] prev  [e] end  [s] start  [q] quit'));

  return lines.join('\n');
}
