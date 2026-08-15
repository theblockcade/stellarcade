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

const router = require('../../src/routes/quests.routes');
const User = require('../../src/models/User.model');
const QuestModel = require('../../src/models/Quest.model');

jest.mock('../../src/models/User.model');
jest.mock('../../src/models/Quest.model');

const app = express();
app.use(express.json());
app.use('/quests', router);
app.use((err, req, res, _next) => {
  res.status(err.statusCode || 500).json({ error: { message: err.message, code: err.code } });
});

describe('GET /quests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('400s when the player query parameter is missing', async () => {
    const res = await request(app).get('/quests');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_QUERY_PARAM');
    expect(User.findByWallet).not.toHaveBeenCalled();
  });

  test('returns the quest catalog at zero progress for a player with no account yet', async () => {
    User.findByWallet.mockResolvedValue(null);
    QuestModel.listDefinitions.mockResolvedValue([
      { id: 1, questId: 'daily-login', title: 'Log in today', target: 1 },
      { id: 2, questId: 'play-5-games', title: 'Play 5 games', target: 5 },
    ]);

    const res = await request(app).get('/quests').query({ player: 'GUNKNOWN' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { questId: 'daily-login', progress: 0, target: 1, claimed: false, streak: 0 },
      { questId: 'play-5-games', progress: 0, target: 5, claimed: false, streak: 0 },
    ]);
    expect(QuestModel.getProgressForUser).not.toHaveBeenCalled();
  });

  test('returns the player\'s real DB-backed progress, not fabricated numbers', async () => {
    User.findByWallet.mockResolvedValue({ id: 7, wallet_address: 'GALICE' });
    QuestModel.getProgressForUser.mockResolvedValue([
      { questId: 'daily-login', target: 1, progress: 1, claimed: true, streak: 4 },
      { questId: 'play-5-games', target: 5, progress: 2, claimed: false, streak: 0 },
    ]);

    const res = await request(app).get('/quests').query({ player: 'GALICE' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { questId: 'daily-login', progress: 1, target: 1, claimed: true, streak: 4 },
      { questId: 'play-5-games', progress: 2, target: 5, claimed: false, streak: 0 },
    ]);
    expect(QuestModel.getProgressForUser).toHaveBeenCalledWith(7);
  });
});
