/**
 * Controller for managing tournament-related API requests.
 */
const tournamentService = require('../services/tournament.service');

const getTournaments = async (req, res, next) => {
  try {
    const tournaments = await tournamentService.listTournaments();
    res.status(200).json(tournaments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTournaments,
};
