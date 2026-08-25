import { getWallet } from '../api/wallet';
import { useAppStore } from '../store/appStore';

let requestSequence = 0;

export async function refreshWallet(
  brokerId: string | number | null | undefined,
  options: { showLoading?: boolean } = {},
): Promise<number> {
  if (brokerId === null || brokerId === undefined || brokerId === '') {
    throw new Error('A broker ID is required to load the wallet.');
  }

  const normalizedBrokerId = String(brokerId);
  const sequence = ++requestSequence;
  if (options.showLoading !== false) {
    useAppStore.getState().beginWalletLoad(normalizedBrokerId);
  }

  try {
    const wallet = await getWallet(normalizedBrokerId);
    const total = wallet.free_credits_balance + wallet.paid_credits_balance;
    if (sequence === requestSequence) {
      useAppStore.getState().setWalletSnapshot(
        normalizedBrokerId,
        wallet.free_credits_balance,
        wallet.paid_credits_balance,
        wallet.updated_at,
      );
    }
    return total;
  } catch (error: any) {
    if (sequence === requestSequence) {
      useAppStore.getState().setWalletError(
        normalizedBrokerId,
        error?.response?.data?.message || error?.message || 'Could not load wallet.',
      );
    }
    throw error;
  }
}

export function invalidateWalletRequests(): void {
  requestSequence += 1;
  useAppStore.getState().resetWallet();
}
