/**
 * Controller for managing wallet transactions (deposits/withdrawals).
 */
const logger = require('../utils/logger');
const audit = require('../services/audit.service');
const { assertWalletNetwork } = require('../services/stellar.service');
const TransactionModel = require('../models/Transaction.model');
const User = require('../models/User.model');
const db = require('../config/database');

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
    const { amount, asset, txHash } = req.body;
    const walletAddress = req.user.walletAddress || req.user.address;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address missing from token claims.' });
    }

    const user = await User.findByWallet(walletAddress);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount.' });
    }

    logger.info(`Deposit request: ${amount} ${asset} for user ${user.id}`);

    // Create Transaction Record
    const tx = await TransactionModel.create({
      user_id: user.id,
      type: 'deposit',
      amount: numAmount,
      status: 'success',
      tx_hash: txHash || '0x' + require('crypto').randomBytes(32).toString('hex'),
    });

    // Update User Balance
    const newBalance = parseFloat(user.balance || 0) + numAmount;
    await db('users').where({ id: user.id }).update({
      balance: newBalance,
      updated_at: db.fn.now()
    });

    res.status(200).json({
      success: true,
      depositAddress: process.env.VAULT_ADDRESS || 'GA2C5RFPE6CXENJUA67TZND6L6SXY67TZND6L6SXY67TZND6L6SXY',
      amount: numAmount,
      balance: newBalance,
      transaction: tx
    });

    audit.log({
      actor: user.wallet_address,
      action: 'wallet.deposit',
      target: user.wallet_address,
      payload: { amount: numAmount, asset },
      outcome: 'success',
    });
  } catch (error) {
    audit.log({
      actor: req.user?.walletAddress || 'anonymous',
      action: 'wallet.deposit',
      target: req.user?.walletAddress || 'unknown',
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
    const walletAddress = req.user.walletAddress || req.user.address;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address missing from token claims.' });
    }

    const user = await User.findByWallet(walletAddress);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount.' });
    }

    if (parseFloat(user.balance || 0) < numAmount) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    logger.info(`Withdrawal request: ${amount} to ${destination} from user ${user.id}`);

    // Create Transaction Record
    const tx = await TransactionModel.create({
      user_id: user.id,
      type: 'withdrawal',
      amount: numAmount,
      status: 'success',
      tx_hash: '0x' + require('crypto').randomBytes(32).toString('hex'),
    });

    // Update User Balance
    const newBalance = parseFloat(user.balance || 0) - numAmount;
    await db('users').where({ id: user.id }).update({
      balance: newBalance,
      updated_at: db.fn.now()
    });

    res.status(200).json({
      success: true,
      status: 'completed',
      amount: numAmount,
      destination,
      balance: newBalance,
      transaction: tx
    });

    audit.log({
      actor: user.wallet_address,
      action: 'wallet.withdraw',
      target: destination,
      payload: { amount: numAmount, destination },
      outcome: 'success',
    });
  } catch (error) {
    audit.log({
      actor: req.user?.walletAddress || 'anonymous',
      action: 'wallet.withdraw',
      target: req.body?.destination || 'unknown',
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
