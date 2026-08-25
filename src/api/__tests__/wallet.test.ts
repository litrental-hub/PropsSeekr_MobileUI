import apiClient from '../client';
import { getCreditTransactions, getWallet } from '../wallet';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;

describe('wallet API', () => {
  beforeEach(() => mockedGet.mockReset());

  it('loads the authenticated broker wallet and normalizes numeric values', async () => {
    mockedGet.mockResolvedValue({ data: {
      free_credits_balance: '7',
      paid_credits_balance: '12',
      free_credits_reset_at: '2026-09-01T00:00:00Z',
    } });

    await expect(getWallet(42)).resolves.toEqual(expect.objectContaining({
      free_credits_balance: 7,
      paid_credits_balance: 12,
      total_credits_balance: 19,
    }));
    expect(mockedGet).toHaveBeenCalledWith('/brokers/42/wallet');
  });

  it('does not silently turn an invalid wallet response into zero', async () => {
    mockedGet.mockResolvedValue({ data: {
      free_credits_balance: undefined,
      paid_credits_balance: 5,
    } });

    await expect(getWallet(42)).rejects.toThrow('invalid balance');
  });

  it('loads token history from the wallet ledger endpoint', async () => {
    const response = { success: true, total_count: 0, page: 1, limit: 20, transactions: [] };
    mockedGet.mockResolvedValue({ data: response });

    await expect(getCreditTransactions(42)).resolves.toEqual(response);
    expect(mockedGet).toHaveBeenCalledWith('/brokers/42/credit-transactions?page=1&limit=20');
  });
});
