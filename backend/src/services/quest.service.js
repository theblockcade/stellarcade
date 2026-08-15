const UserModel = require('../models/User.model');
const QuestModel = require('../models/Quest.model');

/**
 * Service for managing quest-related business logic.
 */
const questService = {
  /**
   * Returns every quest with this player's progress against it. Players who
   * haven't linked an account yet (or have no progress rows) still see the
   * full quest catalog, just at zero/unclaimed — never a 404 or an empty list.
   *
   * @param {string} walletAddress
   * @returns {Promise<Array<{questId: string, progress: number, target: number, claimed: boolean, streak: number}>>}
   */
  getQuestsForPlayer: async (walletAddress) => {
    const user = await UserModel.findByWallet(walletAddress);

    if (!user) {
      const definitions = await QuestModel.listDefinitions();
      return definitions.map((quest) => ({
        questId: quest.questId,
        progress: 0,
        target: quest.target,
        claimed: false,
        streak: 0,
      }));
    }

    const rows = await QuestModel.getProgressForUser(user.id);
    return rows.map((row) => ({
      questId: row.questId,
      progress: Number(row.progress),
      target: Number(row.target),
      claimed: Boolean(row.claimed),
      streak: Number(row.streak),
    }));
  },
};

module.exports = questService;
