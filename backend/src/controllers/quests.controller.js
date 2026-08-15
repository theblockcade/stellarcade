/**
 * Controller for managing quest-related API requests.
 */
const questService = require('../services/quest.service');

const getQuests = async (req, res, next) => {
  try {
    const player = req.query.player;
    if (!player || typeof player !== 'string') {
      const error = new Error('Query parameter "player" is required.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    const quests = await questService.getQuestsForPlayer(player);
    res.status(200).json(quests);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuests,
};
