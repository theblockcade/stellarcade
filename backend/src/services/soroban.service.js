const StellarSdk = require('@stellar/stellar-sdk');
const logger = require('../utils/logger');
const { rpc, passphrase } = require('../config/stellar');
const { STELLAR_ERRORS } = require('./stellar.service');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Custom error for Soroban RPC operations with contract error code support.
 */
class SorobanRpcError extends Error {
  constructor(message, { code = STELLAR_ERRORS.TX_FAILED, contractErrorCode = null, details = null } = {}) {
    super(message);
    this.name = 'SorobanRpcError';
    this.code = code;
    this.contractErrorCode = contractErrorCode;
    this.details = details;
  }
}

/**
 * Extract contract error code from Soroban simulation / transaction error if present.
 */
const extractContractErrorCode = (errorObj) => {
  if (!errorObj) return null;
  if (typeof errorObj.code === 'number') return errorObj.code;
  if (typeof errorObj.contractCode === 'number') return errorObj.contractCode;

  const msg = errorObj.message || String(errorObj);
  const match = msg.match(/Error\(Contract,\s*#(\d+)\)/i) || msg.match(/ContractError\((\d+)\)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

/**
 * Simulate a read-only contract method invocation.
 *
 * @param {string} contractId - StrKey encoded contract address (e.g. C...)
 * @param {string} method - Method name to invoke
 * @param {Array<import('@stellar/stellar-sdk').xdr.ScVal>} args - ScVal arguments
 * @returns {Promise<any>} - Decoded native JavaScript value
 */
const simulate = async (contractId, method, args = []) => {
  try {
    const contract = new StellarSdk.Contract(contractId);
    const callOp = contract.call(method, ...args);

    // Build a dummy transaction for simulation
    const dummySource = new StellarSdk.Account(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      '0'
    );
    const tx = new StellarSdk.TransactionBuilder(dummySource, {
      fee: '100',
      networkPassphrase: passphrase,
    })
      .addOperation(callOp)
      .setTimeout(30)
      .build();

    const simResponse = await rpc.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simResponse) || simResponse.error) {
      const contractErrorCode = extractContractErrorCode(simResponse.error);
      throw new SorobanRpcError(
        `Simulation failed: ${simResponse.error?.message || simResponse.error || 'Unknown simulation error'}`,
        {
          code: STELLAR_ERRORS.TX_FAILED,
          contractErrorCode,
          details: simResponse.error,
        }
      );
    }

    if (simResponse.result && simResponse.result.retval) {
      return StellarSdk.scValToNative(simResponse.result.retval);
    }

    return null;
  } catch (err) {
    if (err instanceof SorobanRpcError) {
      throw err;
    }
    const contractErrorCode = extractContractErrorCode(err);
    logger.error('Soroban simulate call failed:', err.message);
    throw new SorobanRpcError(`Soroban simulation failed: ${err.message}`, {
      code: STELLAR_ERRORS.NETWORK_ERROR,
      contractErrorCode,
      details: err,
    });
  }
};

/**
 * Submit a signed contract invocation and poll until completion.
 *
 * @param {string} contractId - StrKey encoded contract address
 * @param {string} method - Method name to invoke
 * @param {Array<import('@stellar/stellar-sdk').xdr.ScVal>} args - ScVal arguments
 * @param {import('@stellar/stellar-sdk').Keypair} signer - Signer keypair
 * @param {object} [opts] - Options
 * @param {number} [opts.timeoutMs=45000] - Polling timeout in milliseconds
 * @param {number} [opts.pollIntervalMs=1000] - Polling interval
 * @returns {Promise<{ txHash: string, returnValue: any, ledger: number }>}
 */
const invoke = async (contractId, method, args = [], signer, opts = {}) => {
  const timeoutMs = opts.timeoutMs || 45000;
  const pollIntervalMs = opts.pollIntervalMs || 1000;

  try {
    const account = await rpc.getAccount(signer.publicKey());
    const contract = new StellarSdk.Contract(contractId);
    const callOp = contract.call(method, ...args);

    let tx = new StellarSdk.TransactionBuilder(account, {
      fee: '10000',
      networkPassphrase: passphrase,
    })
      .addOperation(callOp)
      .setTimeout(300)
      .build();

    tx = await rpc.prepareTransaction(tx);
    tx.sign(signer);

    const sendResponse = await rpc.sendTransaction(tx);

    if (sendResponse.status === 'ERROR') {
      const contractErrorCode = extractContractErrorCode(sendResponse.errorResult);
      throw new SorobanRpcError(
        `Failed to send Soroban transaction: ${sendResponse.errorResult?.message || sendResponse.status}`,
        {
          code: STELLAR_ERRORS.TX_FAILED,
          contractErrorCode,
          details: sendResponse.errorResult,
        }
      );
    }

    const txHash = sendResponse.hash;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const txStatus = await rpc.getTransaction(txHash);

      if (txStatus.status === 'SUCCESS') {
        const returnValue = txStatus.returnValue
          ? StellarSdk.scValToNative(txStatus.returnValue)
          : null;
        return {
          txHash,
          returnValue,
          ledger: txStatus.ledger,
        };
      }

      if (txStatus.status === 'FAILED') {
        const contractErrorCode = extractContractErrorCode(txStatus.resultXdr);
        throw new SorobanRpcError(
          `Transaction ${txHash} failed on-chain with status FAILED`,
          {
            code: STELLAR_ERRORS.TX_FAILED,
            contractErrorCode,
            details: txStatus,
          }
        );
      }

      // Status is NOT_FOUND or PENDING, wait and poll again
      await sleep(pollIntervalMs);
    }

    throw new SorobanRpcError(`Transaction ${txHash} timed out after ${timeoutMs}ms`, {
      code: STELLAR_ERRORS.TIMEOUT,
    });
  } catch (err) {
    if (err instanceof SorobanRpcError) {
      throw err;
    }
    const contractErrorCode = extractContractErrorCode(err);
    logger.error('Soroban invoke failed:', err.message);
    throw new SorobanRpcError(`Soroban invoke failed: ${err.message}`, {
      code: STELLAR_ERRORS.TX_FAILED,
      contractErrorCode,
      details: err,
    });
  }
};

/**
 * Get contract events matching filters.
 *
 * @param {object} params
 * @param {string[]} [params.contractIds] - List of contract IDs
 * @param {Array<string[]>} [params.topics] - Topic filters
 * @param {number} [params.startLedger] - Starting ledger
 * @param {string} [params.cursor] - Paging token / cursor
 * @param {number} [params.limit] - Max events
 * @returns {Promise<{ events: object[], cursor: string }>}
 */
const getEvents = async (params = {}) => {
  try {
    const filters = [];
    if (params.contractIds && params.contractIds.length > 0) {
      filters.push({
        type: 'contract',
        contractIds: params.contractIds,
        topics: params.topics,
      });
    }

    const response = await rpc.getEvents({
      startLedger: params.startLedger,
      cursor: params.cursor,
      limit: params.limit,
      filters: filters.length > 0 ? filters : undefined,
    });

    return {
      events: response.events || [],
      cursor: response.cursor || (response.events && response.events.length > 0 ? response.events[response.events.length - 1].pagingToken : ''),
    };
  } catch (err) {
    logger.error('Soroban getEvents failed:', err.message);
    throw new SorobanRpcError(`Failed to fetch Soroban events: ${err.message}`, {
      code: STELLAR_ERRORS.NETWORK_ERROR,
      details: err,
    });
  }
};

module.exports = {
  simulate,
  invoke,
  getEvents,
  SorobanRpcError,
};
