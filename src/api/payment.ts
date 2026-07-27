import apiClient from './client';

export interface CreateOrderPayload {
  tierId: string;
}

export interface CreateOrderResponse {
  razorpayOrderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
}

export const createOrder = async (data: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>('/payment/order', data);
  return response.data;
};

export interface VerifyPaymentPayload {
  RazorpayOrderId: string;
  RazorpayPaymentId: string;
  RazorpaySignature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  newBalance: number;
}

export const verifyPayment = async (data: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
  const response = await apiClient.post<VerifyPaymentResponse>('/payment/verify', data);
  return response.data;
};
