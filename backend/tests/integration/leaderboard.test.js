const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/database', () => {
  const mock = jest.fn();
  mock.raw = jest.fn().mockResolvedValue({});
  return mock;
});

jest.mock('../../src/config/redis', () => {
  const mockClient = {
    get: jest.fn(),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue('OK'),
    ttl: jest.fn().mockResolvedValue(60),
    setEx: jest.fn().mockResolvedValue('OK'),
    connect: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    isOpen: true,
  };
  return { client: mockClient, connectPromise: Promise.resolve() };
});

const router = require('../../src/routes/leaderboard.routes');
const GameModel = require('../../src/models/Game.model');

jest.mock('../../src/models/Game.model');

const app = express();
app.use(express.json());
app.use('/leaderboard', router);
app.use((err, req, res, _next) => {
  res.status(err.statusCode || 500).json({ error: { message: err.message, code: err.code } });
});

describe('GET /leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ranks players by total payout, not fabricated scores', async () => {
    GameModel.getLeaderboard.mockResolvedValue([
      { userId: 1, walletAddress: 'GALICE...', username: 'alice', score: '120.5000000' },
      { userId: 2, walletAddress: 'GBOB...', username: 'bob', score: '80.0000000' },
    ]);

    const res = await request(app).get('/leaderboard');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { rank: 1, playerAddress: 'GALICE...', score: '120.5000000' },
      { rank: 2, playerAddress: 'GBOB...', score: '80.0000000' },
    ]);
  });

  test('defaults to a limit of 10 when none is given', async () => {
    GameModel.getLeaderboard.mockResolvedValue([]);

    await request(app).get('/leaderboard');

    expect(GameModel.getLeaderboard).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });

  test('passes the game query param through as a game-type filter', async () => {
    GameModel.getLeaderboard.mockResolvedValue([]);

    await request(app).get('/leaderboard').query({ game: 'coin-flip', limit: 5 });

    expect(GameModel.getLeaderboard).toHaveBeenCalledWith(
      expect.objectContaining({ gameType: 'coin-flip', limit: 5 })
    );
  });

  test('returns an empty array, not fabricated entries, when nobody has played yet', async () => {
    GameModel.getLeaderboard.mockResolvedValue([]);

    const res = await request(app).get('/leaderboard');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
