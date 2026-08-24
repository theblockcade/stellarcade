/**
 * Base model for Tournaments.
 */
const db = require('../config/database');
const logger = require('../utils/logger');

const TournamentModel = {
  /**
   * Lists all tournaments, most recently created first.
   *
   * @returns {Promise<Array<{id: number, gameType: string, status: string, prizePool: string}>>}
   */
  async listAll() {
    try {
      return await db('tournaments')
        .select('id', 'game_type as gameType', 'status', 'prize_pool as prizePool')
        .orderBy('created_at', 'desc');
    } catch (error) {
      logger.error('Error in TournamentModel.listAll:', error);
      throw error;
    }
  },
};

module.exports = TournamentModel;
