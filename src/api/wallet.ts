import apiClient from './client';

export interface WalletResponse {
  free_credits_balance: number;
  paid_credits_balance: number;
  total_credits_balance?: number;
  free_credits_reset_at: string;
  updated_at?: string;
}

export const getWallet = async (brokerId: string | number): Promise<WalletResponse> => {
  const response = await apiClient.get<WalletResponse>(`/brokers/${brokerId}/wallet`);
  const freeBalance = Number(response.data.free_credits_balance);
  const paidBalance = Number(response.data.paid_credits_balance);
  if (!Number.isFinite(freeBalance) || !Number.isFinite(paidBalance)) {
    throw new Error('Wallet API returned an invalid balance.');
  }
  return {
    ...response.data,
    free_credits_balance: freeBalance,
    paid_credits_balance: paidBalance,
    total_credits_balance: freeBalance + paidBalance,
  };
};

export interface CreditTransaction {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  reference_type: string;
  notes: string;
  created_at: string;
}

export interface CreditTransactionsResponse {
  success: boolean;
  total_count: number;
  page: number;
  limit: number;
  transactions: CreditTransaction[];
}

export const getCreditTransactions = async (brokerId: string | number, page: number = 1, limit: number = 20): Promise<CreditTransactionsResponse> => {
  const response = await apiClient.get<CreditTransactionsResponse>(`/brokers/${brokerId}/credit-transactions?page=${page}&limit=${limit}`);
  return response.data;
};
