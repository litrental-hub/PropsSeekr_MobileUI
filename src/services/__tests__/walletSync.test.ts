import { getWallet } from '../../api/wallet';
import { useAppStore } from '../../store/appStore';
import { invalidateWalletRequests, refreshWallet } from '../walletSync';

jest.mock('../../api/wallet', () => ({ getWallet: jest.fn() }));

const mockedGetWallet = getWallet as jest.Mock;

describe('wallet synchronization', () => {
  beforeEach(() => {
    mockedGetWallet.mockReset();
    invalidateWalletRequests();
  });

  it('starts unknown and commits the wallet API snapshot', async () => {
    mockedGetWallet.mockResolvedValue({
      free_credits_balance: 4,
      paid_credits_balance: 8,
      free_credits_reset_at: '2026-09-01T00:00:00Z',
    });

    const promise = refreshWallet(22);
    expect(useAppStore.getState().creditsBalance).toBeNull();
    expect(useAppStore.getState().walletStatus).toBe('loading');

    await expect(promise).resolves.toBe(12);
    expect(useAppStore.getState()).toEqual(expect.objectContaining({
      walletBrokerId: '22',
      creditsBalance: 12,
      freeCreditsBalance: 4,
      paidCreditsBalance: 8,
      walletStatus: 'ready',
    }));
  });

  it('does not let an older request overwrite a newer broker wallet', async () => {
    let resolveOld!: (value: any) => void;
    mockedGetWallet
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce({
        free_credits_balance: 1,
        paid_credits_balance: 2,
        free_credits_reset_at: '2026-09-01T00:00:00Z',
      });

    const oldRequest = refreshWallet(11);
    await refreshWallet(22);
    resolveOld({
      free_credits_balance: 50,
      paid_credits_balance: 50,
      free_credits_reset_at: '2026-09-01T00:00:00Z',
    });
    await oldRequest;

    expect(useAppStore.getState()).toEqual(expect.objectContaining({
      walletBrokerId: '22',
      creditsBalance: 3,
    }));
  });

  it('keeps a previously loaded balance visible when a refresh fails', async () => {
    mockedGetWallet.mockResolvedValueOnce({
      free_credits_balance: 2,
      paid_credits_balance: 6,
      free_credits_reset_at: '2026-09-01T00:00:00Z',
    });
    await refreshWallet(22);
    mockedGetWallet.mockRejectedValueOnce(new Error('network unavailable'));

    await expect(refreshWallet(22)).rejects.toThrow('network unavailable');
    expect(useAppStore.getState()).toEqual(expect.objectContaining({
      creditsBalance: 8,
      walletStatus: 'error',
    }));
  });
});
