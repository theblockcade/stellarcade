/**
 * Unit tests for game.service.playSimpleGame's quest-progress side effects.
 * The win/loss outcome is randomized (crypto.randomBytes), so these tests
 * mock it deterministically to exercise both the win and loss paths.
 */
const mockDbUpdate = jest.fn().mockResolvedValue(1);
const mockDbFirst = jest.fn();
const mockUsersTable = {
  where: jest.fn().mockReturnThis(),
  first: (...args) => mockDbFirst(...args),
  update: (...args) => mockDbUpdate(...args),
};

const mockDb = jest.fn(() => mockUsersTable);
mockDb.fn = { now: jest.fn(() => 'NOW()') };

jest.mock('../../src/config/database', () => mockDb);

jest.mock('../../src/models/Game.model', () => ({
  create: jest.fn().mockResolvedValue({ id: 1 }),
}));

jest.mock('../../src/models/Transaction.model', () => ({
  create: jest.fn().mockResolvedValue({ id: 1 }),
}));

jest.mock('../../src/models/Quest.model', () => ({
  recordProgress: jest.fn().mockResolvedValue({}),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

const QuestModel = require('../../src/models/Quest.model');
const gameService = require('../../src/services/game.service');
const crypto = require('crypto');

describe('game.service.playSimpleGame — quest progress side effects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbFirst.mockResolvedValue({ id: 42, balance: '100.0000000' });
  });

  test('records play-5-games progress on a loss, but not win-3-games', async () => {
    // outcome byte % 2 === 0 -> "heads"; choice "tails" -> loss
    crypto.randomBytes.mockReturnValue(Buffer.from([0]));

    await gameService.playSimpleGame({ userId: 42, gameType: 'coin-flip', wager: 5, choice: 'tails' });

    expect(QuestModel.recordProgress).toHaveBeenCalledWith(42, 'play-5-games', 1);
    expect(QuestModel.recordProgress).not.toHaveBeenCalledWith(42, 'win-3-games', 1);
  });

  test('records both play-5-games and win-3-games progress on a win', async () => {
    // outcome byte % 2 === 0 -> "heads"; choice "heads" -> win
    crypto.randomBytes.mockReturnValue(Buffer.from([0]));

    await gameService.playSimpleGame({ userId: 42, gameType: 'coin-flip', wager: 5, choice: 'heads' });

    expect(QuestModel.recordProgress).toHaveBeenCalledWith(42, 'play-5-games', 1);
    expect(QuestModel.recordProgress).toHaveBeenCalledWith(42, 'win-3-games', 1);
  });

  test('a quest-tracking failure does not break the (already paid out) game result', async () => {
    crypto.randomBytes.mockReturnValue(Buffer.from([0]));
    QuestModel.recordProgress.mockRejectedValue(new Error('db exploded'));

    const result = await gameService.playSimpleGame({
      userId: 42,
      gameType: 'coin-flip',
      wager: 5,
      choice: 'heads',
    });

    expect(result.win).toBe(true);
    expect(result.payout).toBe(10);
  });
});
