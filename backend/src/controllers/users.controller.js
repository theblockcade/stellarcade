/**
 * Controller for managing user-specific operations.
 */
const logger = require('../utils/logger');
const User = require('../models/User.model');
const audit = require('../services/audit.service');

const ALLOWED_AUDIT_ACTIONS = ['wallet.deposit', 'wallet.withdraw', 'game.play'];

const getAuditLogs = async (req, res, next) => {
  try {
    const { actor, action } = req.query;
    const limit = req.query.limit === undefined ? 50 : parseInt(req.query.limit, 10);

    if (req.query.limit !== undefined && (Number.isNaN(limit) || limit < 1)) {
      const error = new Error('Query parameter "limit" must be a positive integer.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    if (action && !ALLOWED_AUDIT_ACTIONS.includes(action)) {
      const error = new Error('Query parameter "action" has an unsupported value.');
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_PARAM';
      throw error;
    }

    const entries = await audit.list({ actor, action, limit });
    res.status(200).json({ items: entries });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const walletAddress = req.user.walletAddress || req.user.address;
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address missing from token claims.' });
    }
    
    let user = await User.findByWallet(walletAddress);
    if (!user) {
      // Auto-create to support seamless login
      user = await User.create({ wallet_address: walletAddress, username: 'player', balance: 0 });
    }
    
    res.status(200).json({
      id: user.id,
      username: user.username || 'player',
      walletAddress: user.wallet_address,
      balance: parseFloat(user.balance || 0)
    });
  } catch (error) {
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    const { walletAddress, username } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: 'walletAddress is required.' });
    }
    
    logger.info(`Creating profile for wallet: ${walletAddress}`);
    let user = await User.findByWallet(walletAddress);
    if (!user) {
      user = await User.create({
        wallet_address: walletAddress,
        username: username || 'player',
        balance: 0
      });
    }
    
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  createProfile,
  getAuditLogs,
};
