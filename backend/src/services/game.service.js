const logger = require('../utils/logger');
const GameModel = require('../models/Game.model');

/**
 * Service for managing game-related business logic.
 */
const gameService = {
  /**
   * Lists games for the public catalog.
   *
   * @returns {Promise<{ games: Array }>}
   */
  listGames: async () => {
    return {
      games: [
        {
          id: "coinflip-duel",
          name: "Coinflip Duel",
          status: "active",
          wager: 5,
          description: "Instant 50/50 provably fair on-chain duel. Double your stake on heads or tails.",
          contract: "coin-flip",
          players: 142,
          category: "PVP / Duel",
        },
        {
          id: "rng-dice",
          name: "Verifiable Dice Roll",
          status: "active",
          wager: 10,
          description: "Multi-sided dice arena backed by cryptographic seed commitments and Soroban RNG.",
          contract: "random-generator",
          players: 89,
          category: "Table / RNG",
        },
        {
          id: "prizepool-gauntlet",
          name: "Prize Pool Gauntlet",
          status: "active",
          wager: 25,
          description: "High-roller reserve pool with accumulated yields and on-chain payout splits.",
          contract: "prize-pool",
          players: 37,
          category: "Jackpot / Pool",
        }
      ]
    };
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
      score: String(row.score || 0),
    }));
  },

  /**
   * Real database-backed play outcome and user balance updates.
   *
   * @param {Object} payload
   * @param {number|string} payload.userId
   * @param {string} payload.gameType
   * @param {number} payload.wager
   * @param {string} payload.choice
   * @returns {Promise<{ result: string, win: boolean, payout: number, txHash: string, balance: number }>}
   */
  playSimpleGame: async ({ userId, gameType, wager, choice }) => {
    logger.info(`User ${userId} playing ${gameType} with wager ${wager} and choice ${choice}`);
    const db = require('../config/database');
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    const numWager = parseFloat(wager || 0);
    if (parseFloat(user.balance || 0) < numWager) {
      throw new Error('Insufficient balance to place bet.');
    }

    // Determine outcome (heads or tails)
    const outcome = require('crypto').randomBytes(1)[0] % 2 === 0 ? 'heads' : 'tails';
    const won = String(choice).toLowerCase() === outcome;
    const payout = won ? numWager * 2 : 0;
    const result = won ? 'win' : 'loss';

    // Update user balance
    const newBalance = parseFloat(user.balance || 0) - numWager + payout;

    const txHash = '0x' + require('crypto').randomBytes(32).toString('hex');

    // Create DB records
    await GameModel.create({
      user_id: user.id,
      game_type: gameType,
      bet_amount: numWager,
      result: result,
      payout: payout,
      tx_hash: txHash,
    });

    const TransactionModel = require('../models/Transaction.model');
    await TransactionModel.create({
      user_id: user.id,
      type: 'game.play',
      amount: numWager,
      status: 'success',
      tx_hash: txHash,
    });

    await db('users').where({ id: user.id }).update({
      balance: newBalance,
      updated_at: db.fn.now(),
    });

    return {
      result: outcome,
      win: won,
      payout,
      txHash,
      balance: newBalance,
    };
  },
};

module.exports = gameService;
