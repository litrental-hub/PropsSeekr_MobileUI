import apiClient from './client';

// ── Registration ────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string;
  mobile: string;
  email: string;
  password?: string;
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

// ── Login ───────────────────────────────────────────────────────────────
export interface LoginPayload {
  identifier: string;
  password?: string;
}

export interface UserDTO {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  isMobileVerified: boolean;
  isEmailVerified: boolean;
  credits: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDTO;
}

export const login = async (data: LoginPayload): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
};

// ── Email OTP ───────────────────────────────────────────────────────────
export interface SendEmailOTPPayload {
  email: string;
  purpose: string;
}

export interface SendEmailOTPResponse {
  success: boolean;
  message: string;
}

export const sendEmailOTP = async (data: SendEmailOTPPayload): Promise<SendEmailOTPResponse> => {
  const response = await apiClient.post<SendEmailOTPResponse>('/auth/send-email-otp', data);
  return response.data;
};

export interface VerifyEmailOTPPayload {
  email: string;
  otp: string;
  purpose: string;
}

export interface VerifyEmailOTPResponse {
  success: boolean;
  message: string;
  token: string;
  expiresAt: string;
}

export const verifyEmailOTP = async (data: VerifyEmailOTPPayload): Promise<VerifyEmailOTPResponse> => {
  const response = await apiClient.post<VerifyEmailOTPResponse>('/auth/verify-email-otp', data);
  return response.data;
};
