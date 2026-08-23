import apiClient from './client';

export interface WalletResponse {
  free_credits_balance: number;
  paid_credits_balance: number;
  free_credits_reset_at: string;
}

export const getWallet = async (brokerId: string | number): Promise<WalletResponse> => {
  const response = await apiClient.get<WalletResponse>(`/brokers/${brokerId}/wallet`);
  return response.data;
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
