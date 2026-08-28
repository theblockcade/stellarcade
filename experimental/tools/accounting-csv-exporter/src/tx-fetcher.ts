/**
 * Transaction fetcher — currently returns mock data for experimental use.
 *
 * In a production build this would query Horizon or the Soroban RPC for
 * contract events, then parse them into the same Transaction shape.
 */

export type TxType = 'Wager Inflow' | 'Prize Payout' | 'Fee Revenue' | 'Staking Yield';

export interface Transaction {
  hash: string;
  timestamp: string; // ISO-8601 UTC
  type: TxType;
  asset: string;
  amount: string;   // decimal string (already converted from stroops)
  fee: string;      // decimal string in XLM
  sender: string;
  recipient: string;
}

export interface FetchOptions {
  contractId: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Deterministic mock transaction generator.
 *
 * Produces a predictable set of transactions so tests and demos are
 * reproducible.  The output is filtered to the caller's date range.
 */
function generateMockTransactions(contractId: string): Transaction[] {
  const baseTs = new Date('2025-07-01T12:00:00Z').getTime();
  const oneHour = 3_600_000;

  // Deterministic pseudo-hash based on contractId
  const shortId = contractId.slice(0, 8);

  const types: TxType[] = [
    'Wager Inflow',
    'Prize Payout',
    'Fee Revenue',
    'Staking Yield',
  ];

  const assets = ['XLM', 'USDC', 'yBTC'];

  const senders = [
    'GAINVT7VBFSC6KID7MYFCN7OCZPR5WCN5V6ABH2M3G2Z5RSJLXSD7CU6',
    'GDF4GK5TANBJD6U4EMSSVQIYIYK6WCPZC7YV27S3QZ6OB5FZU5YXRPWR',
    'GCFXHS6GV2M57PBY5N6YHPA3M5AFL5LH6QYGXGJCLH5E3Z2AFGM6WQFA',
  ];

  const recipients = [
    'GCCD6AJOYZCUAQLX32ZVJ2CJZOB7GJ7XDYY3HASXVQDNALWFN7MGA4KG',
    'GDDSCBD4L5A7M6XXSY7AHTQ7GD3AQMNN5MFZRLRCDNT6YVVNDEFLA53S',
    'GDZ5IHLF3W6SZLHV457ZSXIILHT6DKOVIKXGMPLCWVL5JXQVSS2MYW5I',
  ];

  const txns: Transaction[] = [];

  for (let i = 0; i < 6; i++) {
    const type = types[i % types.length];
    const asset = assets[i % assets.length];
    const sender = senders[i % senders.length];
    const recipient = recipients[i % recipients.length];
    const ts = new Date(baseTs + i * oneHour);

    // Amounts in stroops, converted to decimal
    const amountStroops = (i + 1) * 100_000_000; // 1-6 XLM equivalent
    const feeStroops = 100_000; // 0.01 XLM

    txns.push({
      hash: `${shortId}TX${String(i).padStart(4, '0')}${'A'.repeat(52 - shortId.length - 7)}`,
      timestamp: ts.toISOString(),
      type,
      asset,
      amount: stroopsToDecimal(amountStroops),
      fee: stroopsToDecimal(feeStroops),
      sender,
      recipient,
    });
  }

  return txns;
}

function stroopsToDecimal(stroops: number): string {
  return (stroops / 10_000_000).toFixed(7);
}

/**
 * Fetch transactions for a contract within a date range.
 *
 * Currently returns mock data. Swap the body for real RPC calls later.
 */
export async function fetchTransactions(opts: FetchOptions): Promise<Transaction[]> {
  const all = generateMockTransactions(opts.contractId);

  return all.filter((tx) => {
    const ts = new Date(tx.timestamp);
    return ts >= opts.startDate && ts <= endOfDay(opts.endDate);
  });
}

function endOfDay(d: Date): Date {
  // End of the given UTC day: 23:59:59.999
  return new Date(d.getTime() + 86_399_999);
}
