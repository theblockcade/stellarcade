/**
 * Centralized model index for managing database interactions.
 */
const UserModel = require('./User.model');
const GameModel = require('./Game.model');
const TransactionModel = require('./Transaction.model');
const AuditLogModel = require('./AuditLog.model');

module.exports = {
  User: UserModel,
  Game: GameModel,
  Transaction: TransactionModel,
  AuditLog: AuditLogModel,
  UserModel,
  GameModel,
  TransactionModel,
  AuditLogModel,
};
