/**
 * Controller for managing all game-related API requests.
 */
const gameService = require('../services/game.service');
const audit = require('../services/audit.service');

const getGames = async (req, res, next) => {
  try {
    const result = await gameService.listGames();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRecentGames = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { gameType, status, sortBy, sortDir } = req.query;

    const result = await gameService.getRecentGames({
      page,
      limit,
      gameType,
      status,
      sortBy,
      sortDir,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const playSimpleGame = async (req, res, next) => {
  try {
    const { gameType, _amount, _choice } = req.body;
    const result = await gameService.playSimpleGame({
      userId: req.user.id,
      gameType,
    });
    res.status(200).json(result);
    audit.log({
      actor: req.user.id,
      action: 'game.play',
      target: gameType,
      payload: { gameType },
      outcome: 'success',
    });
  } catch (error) {
    audit.log({
      actor: req.user?.id || 'anonymous',
      action: 'game.play',
      target: req.body?.gameType || 'unknown',
      outcome: 'failure',
      metadata: { error: error.message },
    });
    next(error);
  }
};

module.exports = {
  getGames,
  getRecentGames,
  playSimpleGame,
};
