/**
 * Controller for managing wallet transactions (deposits/withdrawals).
 */
const logger = require('../utils/logger');
const audit = require('../services/audit.service');
const { assertWalletNetwork } = require('../services/stellar.service');
const User = require('../models/User.model');

const validateWalletNetwork = (req) => {
  const expectedNetwork = process.env.STELLAR_NETWORK || 'testnet';
  const walletNetwork = req.headers['x-wallet-network'];
  assertWalletNetwork({ walletNetwork, expectedNetwork });
};

const getBalance = async (req, res, next) => {
  try {
    const { address } = req.params;
    const user = await User.findByWallet(address);

    if (!user) {
      const error = new Error(`No account found for wallet address ${address}.`);
      error.statusCode = 404;
      error.code = 'WALLET_NOT_FOUND';
      throw error;
    }

    res.status(200).json({
      address: user.wallet_address,
      balances: { XLM: String(user.balance) },
    });
  } catch (error) {
    next(error);
  }
};

const deposit = async (req, res, next) => {
  try {
    validateWalletNetwork(req);
    const { amount, asset } = req.body;
    logger.info(`Deposit request: ${amount} ${asset}`);
    // TODO: Implementation logic
    res.status(200).json({ depositAddress: 'G...' });
    audit.log({
      actor: req.user?.id || 'anonymous',
      action: 'wallet.deposit',
      target: req.user?.id || 'unknown',
      payload: { amount, asset },
      outcome: 'success',
    });
  } catch (error) {
    audit.log({
      actor: req.user?.id || 'anonymous',
      action: 'wallet.deposit',
      target: req.user?.id || 'unknown',
      outcome: 'failure',
      metadata: { error: error.message },
    });
    next(error);
  }
};

const withdraw = async (req, res, next) => {
  try {
    validateWalletNetwork(req);
    const { amount, destination } = req.body;
    logger.info(`Withdrawal request: ${amount} to ${destination}`);
    // TODO: Implementation logic
    res.status(200).json({ status: 'initiated' });
    audit.log({
      actor: req.user?.id || 'anonymous',
      action: 'wallet.withdraw',
      target: req.user?.id || 'unknown',
      payload: { amount, destination },
      outcome: 'success',
    });
  } catch (error) {
    audit.log({
      actor: req.user?.id || 'anonymous',
      action: 'wallet.withdraw',
      target: req.user?.id || 'unknown',
      outcome: 'failure',
      metadata: { error: error.message },
    });
    next(error);
  }
};

module.exports = {
  getBalance,
  deposit,
  withdraw,
};
