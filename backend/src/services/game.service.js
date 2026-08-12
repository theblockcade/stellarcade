const logger = require('../utils/logger');
const GameModel = require('../models/Game.model');

/**
 * Service for managing game-related business logic.
 */
const gameService = {
  /**
   * Lists games for the public catalog. DB-backed listing is not wired yet.
   *
   * @returns {Promise<{ games: Array }>}
   */
  listGames: async () => {
    return { games: [] };
  },

  /**
   * Fetches recent games with pagination metadata.
   *
   * @param {Object} params - Query parameters
   * @returns {Promise<{items: Array, page: number, pageSize: number, total: number, totalPages: number}>}
   */
  getRecentGames: async (params) => {
    const requestedPage = Math.max(Number(params.page) || 1, 1);
    const cursorPage = Math.max(Number(params.cursor) || requestedPage, 1);
    const effectiveParams = {
      ...params,
      page: cursorPage,
    };

    const { items, total, page, pageSize } = await GameModel.findRecent(effectiveParams);
    const totalPages = Math.ceil(total / pageSize) || 0;
    const nextPage = page < totalPages ? page + 1 : null;
    const nextCursor = nextPage ? String(nextPage) : null;
    const hasNextPage = nextPage !== null;

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
      pagination: {
        nextCursor,
        hasNextPage,
      },
    };
  },

  /**
   * Ranks players by total payout (winnings), optionally scoped to one game type.
   *
   * @param {Object} params
   * @param {string} [params.gameType]
   * @param {number} [params.limit=10]
   * @returns {Promise<Array<{rank: number, playerAddress: string, score: string}>>}
   */
  getLeaderboard: async ({ gameType, limit = 10 } = {}) => {
    const rows = await GameModel.getLeaderboard({ gameType, limit });
    return rows.map((row, index) => ({
      rank: index + 1,
      playerAddress: row.walletAddress,
      score: String(row.score),
    }));
  },

  /**
   * Placeholder for simple play flow until contract + persistence are integrated.
   *
   * @param {Object} payload
   * @param {number|string} payload.userId
   * @param {string} payload.gameType
   * @returns {Promise<{ success: boolean }>}
   */
  playSimpleGame: async ({ userId, gameType }) => {
    logger.info(`User ${userId} playing ${gameType}`);
    return { success: true };
  },
};

module.exports = gameService;
