const TournamentModel = require('../models/Tournament.model');

/**
 * Service for managing tournament-related business logic.
 */
const tournamentService = {
  /**
   * Lists all tournaments.
   *
   * @returns {Promise<Array<{tournamentId: string, gameId: string, status: string, prizePool: string}>>}
   */
  listTournaments: async () => {
    const rows = await TournamentModel.listAll();
    return rows.map((row) => ({
      tournamentId: String(row.id),
      gameId: row.gameType,
      status: row.status,
      prizePool: String(row.prizePool),
    }));
  },
};

module.exports = tournamentService;
