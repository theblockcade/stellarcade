import { describe, it, expect, vi, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { checkAccounts, fundWithFriendbot, loadAddresses, lookupAccount, lookupAccounts } from './checker';

function mockFetchResponse(status: number, body: unknown): void {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as typeof fetch;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lookupAccount', () => {
  it('returns an activated snapshot for a 200 response', async () => {
    mockFetchResponse(200, {
      account_id: 'GFUNDED',
      subentry_count: 2,
      balances: [
        { asset_type: 'native', balance: '100.0000000' },
        { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GISSUER', balance: '5.0' },
      ],
    });

    const result = await lookupAccount('GFUNDED', 'https://horizon-testnet.stellar.org');

    expect(result.activated).toBe(true);
    if (result.activated) {
      expect(result.accountId).toBe('GFUNDED');
      expect(result.subentryCount).toBe(2);
      expect(result.balances).toHaveLength(2);
      expect(result.balances[1].assetCode).toBe('USDC');
    }
  });

  it('returns activated: false for a 404 response instead of throwing', async () => {
    mockFetchResponse(404, { status: 404, detail: 'Resource Missing' });

    const result = await lookupAccount('GUNFUNDED', 'https://horizon-testnet.stellar.org');

    expect(result.activated).toBe(false);
    expect(result.accountId).toBe('GUNFUNDED');
  });

  it('throws on a non-404 error response', async () => {
    mockFetchResponse(500, { status: 500, detail: 'Internal Server Error' });

    await expect(lookupAccount('GBAD', 'https://horizon-testnet.stellar.org')).rejects.toThrow(/500/);
  });

  it('strips a trailing slash from the horizon URL before building the request', async () => {
    mockFetchResponse(200, { account_id: 'G1', subentry_count: 0, balances: [] });

    await lookupAccount('G1', 'https://horizon-testnet.stellar.org/');

    expect(global.fetch).toHaveBeenCalledWith('https://horizon-testnet.stellar.org/accounts/G1');
  });
});

describe('lookupAccounts', () => {
  it('looks up multiple accounts and preserves input order', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const id = url.split('/').pop();
      if (id === 'G2') {
        return { status: 404, ok: false, json: async () => ({}), text: async () => 'not found' };
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({ account_id: id, subentry_count: 0, balances: [] }),
        text: async () => '',
      };
    }) as unknown as typeof fetch;

    const results = await lookupAccounts(['G1', 'G2', 'G3'], 'https://horizon-testnet.stellar.org');

    expect(results.map((r) => r.accountId)).toEqual(['G1', 'G2', 'G3']);
    expect(results[1].activated).toBe(false);
  });
});

describe('fundWithFriendbot', () => {
  it('resolves without throwing on a successful funding response', async () => {
    mockFetchResponse(200, { successful: true });
    await expect(fundWithFriendbot('GNEW')).resolves.toBeUndefined();
  });

  it('throws with a descriptive message on a failed funding response', async () => {
    mockFetchResponse(400, { detail: 'createAccountAlreadyExist' });
    await expect(fundWithFriendbot('GEXISTS')).rejects.toThrow(/Friendbot funding failed/);
  });
});

describe('loadAddresses', () => {
  it('parses a JSON array file', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(['GABC', 'GDEF']));
    const addresses = await loadAddresses('addresses.json');
    expect(addresses).toEqual(['GABC', 'GDEF']);
  });

  it('parses a newline-delimited plain text file', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue('GABC\nGDEF\n\nGHIJ');
    const addresses = await loadAddresses('addresses.txt');
    expect(addresses).toEqual(['GABC', 'GDEF', 'GHIJ']);
  });

  it('parses a comma-separated CSV file', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue('GABC,GDEF,GHIJ');
    const addresses = await loadAddresses('addresses.csv');
    expect(addresses).toEqual(['GABC', 'GDEF', 'GHIJ']);
  });

  it('throws when the JSON file does not contain an array', async () => {
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify({ not: 'an array' }));
    await expect(loadAddresses('bad.json')).rejects.toThrow(/JSON array/);
  });
});

describe('checkAccounts', () => {
  it('evaluates every address and returns one report per address', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      const id = url.split('/').pop();
      return {
        status: 200,
        ok: true,
        json: async () => ({
          account_id: id,
          subentry_count: 0,
          balances: [{ asset_type: 'native', balance: '100' }],
        }),
        text: async () => '',
      };
    }) as unknown as typeof fetch;

    const reports = await checkAccounts(['G1', 'G2'], 'https://horizon-testnet.stellar.org', [], {
      autoFund: false,
    });

    expect(reports).toHaveLength(2);
    expect(reports[0].status).toBe('healthy');
  });

  it('auto-funds an unactivated account, re-checks it, and reports the fresh health', async () => {
    let fundedCallCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('friendbot')) {
        fundedCallCount += 1;
        return { status: 200, ok: true, json: async () => ({}), text: async () => '' };
      }
      if (fundedCallCount === 0) {
        return { status: 404, ok: false, json: async () => ({}), text: async () => 'not found' };
      }
      return {
        status: 200,
        ok: true,
        json: async () => ({
          account_id: 'GNEW',
          subentry_count: 0,
          balances: [{ asset_type: 'native', balance: '10000' }],
        }),
        text: async () => '',
      };
    }) as unknown as typeof fetch;

    const onFunding = vi.fn();
    const reports = await checkAccounts(
      ['GNEW'],
      'https://horizon-testnet.stellar.org',
      [],
      { autoFund: true },
      onFunding
    );

    expect(fundedCallCount).toBe(1);
    expect(onFunding).toHaveBeenCalledWith('GNEW');
    expect(reports[0].activated).toBe(true);
    expect(reports[0].status).toBe('healthy');
  });

  it('does not auto-fund when autoFund is false, leaving the account unactivated', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
      json: async () => ({}),
      text: async () => 'not found',
    }) as unknown as typeof fetch;

    const reports = await checkAccounts(['GNEW'], 'https://horizon-testnet.stellar.org', [], {
      autoFund: false,
    });

    expect(reports[0].activated).toBe(false);
    expect(reports[0].status).toBe('danger');
  });

  it('invokes onFundingError and still returns a report when Friendbot funding fails', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('friendbot')) {
        return { status: 400, ok: false, json: async () => ({}), text: async () => 'already funded' };
      }
      return { status: 404, ok: false, json: async () => ({}), text: async () => 'not found' };
    }) as unknown as typeof fetch;

    const onFundingError = vi.fn();
    const reports = await checkAccounts(
      ['GNEW'],
      'https://horizon-testnet.stellar.org',
      [],
      { autoFund: true },
      undefined,
      onFundingError
    );

    expect(onFundingError).toHaveBeenCalledWith('GNEW', expect.any(Error));
    expect(reports[0].activated).toBe(false);
  });
});
