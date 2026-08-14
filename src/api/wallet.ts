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
