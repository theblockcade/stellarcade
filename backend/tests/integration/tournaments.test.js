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

const router = require('../../src/routes/tournaments.routes');
const TournamentModel = require('../../src/models/Tournament.model');

jest.mock('../../src/models/Tournament.model');

const app = express();
app.use(express.json());
app.use('/tournaments', router);
app.use((err, req, res, _next) => {
  res.status(err.statusCode || 500).json({ error: { message: err.message, code: err.code } });
});

describe('GET /tournaments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lists tournaments from the database, not fabricated entries', async () => {
    TournamentModel.listAll.mockResolvedValue([
      { id: 3, gameType: 'coin-flip', status: 'active', prizePool: '500.0000000' },
      { id: 2, gameType: 'dice-roll', status: 'upcoming', prizePool: '250.0000000' },
    ]);

    const res = await request(app).get('/tournaments');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { tournamentId: '3', gameId: 'coin-flip', status: 'active', prizePool: '500.0000000' },
      { tournamentId: '2', gameId: 'dice-roll', status: 'upcoming', prizePool: '250.0000000' },
    ]);
  });

  test('returns an empty array, not fabricated entries, when there are no tournaments', async () => {
    TournamentModel.listAll.mockResolvedValue([]);

    const res = await request(app).get('/tournaments');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
