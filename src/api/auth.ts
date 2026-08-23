import apiClient from './client';

// ── Registration ────────────────────────────────────────────────────────
export interface RegisterPayload {
  name: string;
  mobile: string;
  email?: string;
  password?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadharNumber?: string;
  panCard?: string;
}

export interface RegisterResponse {
  userId: string;
  message: string;
}

export const register = async (data: RegisterPayload): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
};

// ── Admin Login ──────────────────────────────────────────────────────────
export interface AdminLoginPayload {
  userName?: string;
  password?: string;
}

export interface AdminLoginResponse {
  token: string;
  expiresAt: string;
  userName: string;
}

export const adminLogin = async (data: AdminLoginPayload): Promise<AdminLoginResponse> => {
  const response = await apiClient.post<AdminLoginResponse>('/auth/admin-login', data);
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
  isEmailVerified?: boolean;
  credits: number;
  brokerId?: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  user?: UserDTO;
  broker?: {
    broker_id: string | number;
    name: string;
    mobile: string;
    email?: string;
  };
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

// ── Mobile OTP ──────────────────────────────────────────────────────────
export interface SendOTPPayload {
  mobileNumber: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

export const sendOTP = async (data: SendOTPPayload): Promise<SendOTPResponse> => {
  const response = await apiClient.post<SendOTPResponse>('/auth/send-otp', data);
  return response.data;
};

export interface VerifyOTPPayload {
  mobileNumber: string;
  otpCode: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  userId?: string;
  userName?: string;
  brokerId?: number;
}

export const verifyOTP = async (data: VerifyOTPPayload): Promise<VerifyOTPResponse> => {
  const response = await apiClient.post<VerifyOTPResponse>('/auth/verify-otp', data);
  return response.data;
};

export interface ResendOTPPayload {
  mobileNumber: string;
}

export interface ResendOTPResponse {
  success: boolean;
  message: string;
}

export const resendOTP = async (data: ResendOTPPayload): Promise<ResendOTPResponse> => {
  const response = await apiClient.post<ResendOTPResponse>('/auth/resend-otp', data);
  return response.data;
};

// ── Logout ──────────────────────────────────────────────────────────────
export const logout = async (): Promise<any> => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

