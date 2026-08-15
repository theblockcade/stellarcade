/**
 * Base model for Quests and per-user quest progress.
 */
const db = require('../config/database');
const logger = require('../utils/logger');

const QuestModel = {
  /**
   * Lists the quest catalog (definitions only, no per-user progress).
   *
   * @returns {Promise<Array<{id: number, questId: string, title: string, target: number}>>}
   */
  async listDefinitions() {
    try {
      return await db('quests')
        .select('id', 'quest_id as questId', 'title', 'target')
        .orderBy('id');
    } catch (error) {
      logger.error('Error in QuestModel.listDefinitions:', error);
      throw error;
    }
  },

  /**
   * Lists every quest with this user's progress against it, defaulting to
   * zero/unclaimed for quests the user hasn't touched yet.
   *
   * @param {number} userId
   * @returns {Promise<Array<{questId: string, target: number, progress: number, claimed: boolean, streak: number}>>}
   */
  async getProgressForUser(userId) {
    try {
      return await db('quests')
        .leftJoin('user_quests', function joinOnUser() {
          this.on('user_quests.quest_id', '=', 'quests.id').andOn(
            'user_quests.user_id',
            '=',
            db.raw('?', [userId])
          );
        })
        .select(
          'quests.quest_id as questId',
          'quests.target as target',
          db.raw('COALESCE(user_quests.progress, 0) as progress'),
          db.raw('COALESCE(user_quests.claimed, false) as claimed'),
          db.raw('COALESCE(user_quests.streak, 0) as streak')
        )
        .orderBy('quests.id');
    } catch (error) {
      logger.error('Error in QuestModel.getProgressForUser:', error);
      throw error;
    }
  },
};

module.exports = QuestModel;
