import apiClient from './client';

export interface DeductCreditsPayload {
  broker_id: number;
  amount: number;
  notes?: string;
}

export interface DeductCreditsResponse {
  success: boolean;
  broker_id: number;
  free_credits_balance: number;
  paid_credits_balance: number;
}

export const deductCredits = async (data: DeductCreditsPayload): Promise<DeductCreditsResponse> => {
  const response = await apiClient.post<DeductCreditsResponse>('/credits/deduct', data);
  return response.data;
};

export interface GrantMonthlyCreditsResponse {
  success: boolean;
  message: string;
  reset_count: number;
}

export const grantMonthlyCredits = async (): Promise<GrantMonthlyCreditsResponse> => {
  const response = await apiClient.post<GrantMonthlyCreditsResponse>('/credits/grant-monthly');
  return response.data;
};

export interface ExpireCheckResponse {
  success: boolean;
  message: string;
  expired_count: number;
}

export const triggerMatchesExpireCheck = async (): Promise<ExpireCheckResponse> => {
  const response = await apiClient.post<ExpireCheckResponse>('/matching/expire-check');
  return response.data;
};
