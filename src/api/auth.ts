import apiClient from './client';

export interface RegisterPayload {
  name: string;
  mobile: string;
  aadharNumber?: string;
  panCard?: string;
  gstNumber?: string;
  reraRegistrationNumber?: string;
}

export interface RegisterResponse {
  userId: string;
  message: string;
}

export const register = async (data: RegisterPayload): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
};

export interface ResendOTPPayload {
  mobileNumber: string;
}

export interface ResendOTPResponse {
  message: string;
  expiresAt: string;
}

export const resendOTP = async (data: ResendOTPPayload): Promise<ResendOTPResponse> => {
  const response = await apiClient.post<ResendOTPResponse>('/auth/resend-otp', data);
  return response.data;
};
