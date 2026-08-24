import {
  EventType,
  MockEvent,
  MatchStartedPayload,
  WagerDepositedPayload,
  RoundSettledPayload,
  JackpotWonPayload,
  PlayerAddress,
  WagerAmount,
} from './types';

const GAME_TYPES = ['coin-flip', 'pattern-puzzle', 'prize-pool', 'roulette'];
const RESULTS = ['win', 'loss', 'draw'];
const ASSETS = ['XLM', 'USDC', 'stellar'];

const generatePlayerAddress = (random: boolean = false): PlayerAddress => {
  if (random) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let publicKey = 'G';
    for (let i = 0; i < 55; i++) {
      publicKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return { publicKey };
  }
  return {
    publicKey: 'GABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2',
    secretKey: 'SABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ234567ABCDEFGHJKLMNPQRSTUVWXYZ2',
  };
};

const generateWagerAmount = (random: boolean = false): WagerAmount => {
  if (random) {
    const amount = (Math.random() * 1000).toFixed(2);
    const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)];
    return { amount, asset };
  }
  return { amount: '100.00', asset: 'XLM' };
};

const generateMatchId = (): string => {
  return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const emitMatchStarted = (
  contractId: string,
  randomPayload: boolean = false
): MockEvent => {
  const payload: MatchStartedPayload = {
    matchId: generateMatchId(),
    player: generatePlayerAddress(randomPayload),
    wager: generateWagerAmount(randomPayload),
    gameType: randomPayload 
      ? GAME_TYPES[Math.floor(Math.random() * GAME_TYPES.length)]
      : 'coin-flip',
  };

  return {
    type: 'match_started',
    timestamp: new Date().toISOString(),
    contractId,
    payload,
  };
};

export const emitWagerDeposited = (
  contractId: string,
  randomPayload: boolean = false
): MockEvent => {
  const payload: WagerDepositedPayload = {
    matchId: generateMatchId(),
    player: generatePlayerAddress(randomPayload),
    amount: generateWagerAmount(randomPayload),
    timestamp: new Date().toISOString(),
  };

  return {
    type: 'wager_deposited',
    timestamp: new Date().toISOString(),
    contractId,
    payload,
  };
};

export const emitRoundSettled = (
  contractId: string,
  randomPayload: boolean = false
): MockEvent => {
  const payload: RoundSettledPayload = {
    matchId: generateMatchId(),
    winner: generatePlayerAddress(randomPayload),
    loser: generatePlayerAddress(randomPayload),
    result: randomPayload 
      ? RESULTS[Math.floor(Math.random() * RESULTS.length)]
      : 'win',
    payout: generateWagerAmount(randomPayload),
  };

  return {
    type: 'round_settled',
    timestamp: new Date().toISOString(),
    contractId,
    payload,
  };
};

export const emitJackpotWon = (
  contractId: string,
  randomPayload: boolean = false
): MockEvent => {
  const payload: JackpotWonPayload = {
    matchId: generateMatchId(),
    winner: generatePlayerAddress(randomPayload),
    jackpotAmount: {
      amount: randomPayload 
        ? (Math.random() * 10000).toFixed(2)
        : '5000.00',
      asset: 'XLM',
    },
    totalPlayers: randomPayload 
      ? Math.floor(Math.random() * 100) + 10
      : 50,
  };

  return {
    type: 'jackpot_won',
    timestamp: new Date().toISOString(),
    contractId,
    payload,
  };
};

export const emitEvent = (
  eventType: EventType,
  contractId: string,
  randomPayload: boolean = false
): MockEvent => {
  switch (eventType) {
    case 'match_started':
      return emitMatchStarted(contractId, randomPayload);
    case 'wager_deposited':
      return emitWagerDeposited(contractId, randomPayload);
    case 'round_settled':
      return emitRoundSettled(contractId, randomPayload);
    case 'jackpot_won':
      return emitJackpotWon(contractId, randomPayload);
    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
};