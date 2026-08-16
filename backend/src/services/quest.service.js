const UserModel = require('../models/User.model');
const QuestModel = require('../models/Quest.model');
const logger = require('../utils/logger');

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

    // Checking your quests is itself the "showed up today" signal for
    // platforms (Telegram) that have no other profile-visit hook —
    // best-effort, must never fail the actual quest read.
    try {
      await QuestModel.recordDailyLogin(user.id);
    } catch (err) {
      logger.error('Failed to record daily-login quest progress:', err);
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
