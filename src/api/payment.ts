import apiClient from './client';

export interface CreateOrderPayload {
  packageId?: string;
  tokenAmount?: number;
  amountInRupees?: number;
  tierId?: string;
  [key: string]: any;
}

export interface CreateOrderResponse {
  razorpayOrderId?: string;
  orderId?: string;
  amountInPaise?: number;
  amount?: number;
  currency?: string;
  keyId?: string;
  [key: string]: any;
}

export const createOrder = async (data: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>('/payment/order', data);
  return response.data;
};

export interface VerifyPaymentPayload {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  RazorpayOrderId?: string;
  RazorpayPaymentId?: string;
  RazorpaySignature?: string;
  [key: string]: any;
}

export interface VerifyPaymentResponse {
  success?: boolean;
  status?: string;
  message?: string;
  newBalance?: number;
  creditsBalance?: number;
  [key: string]: any;
}

export const verifyPayment = async (data: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
  const payload = {
    razorpayOrderId: data.razorpayOrderId || data.RazorpayOrderId,
    razorpayPaymentId: data.razorpayPaymentId || data.RazorpayPaymentId,
    razorpaySignature: data.razorpaySignature || data.RazorpaySignature,
    ...data,
  };
  const response = await apiClient.post<VerifyPaymentResponse>('/payment/verify', payload);
  return response.data;
};

