import apiClient from './client';

export interface CreateOrderPayload {
  tierId: string;
}

export interface CreateOrderResponse {
  razorpayOrderId?: string;
  orderId?: string;
  amountInPaise?: number;
  amount?: number;
  currency?: string;
  keyId?: string;
  receipt?: string;
  [key: string]: any;
}

export const createOrder = async (data: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const response = await apiClient.post<CreateOrderResponse>('/payment/order', data);
  return response.data;
};

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status?: string;
  message?: string;
  newBalance?: number;
  creditsBalance?: number;
}

export const verifyPayment = async (data: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
  const response = await apiClient.post<VerifyPaymentResponse>('/payment/verify', data);
  return response.data;
};

// ── Additional Payment Endpoints (Entire Flow) ───────────────────

export interface CreditPack {
  id: number;
  name: string;
  credits: number;
  price: number;
}

export interface GetCreditPacksResponse {
  success: boolean;
  packs: CreditPack[];
}

export const getCreditPacks = async (): Promise<GetCreditPacksResponse> => {
  const response = await apiClient.get<GetCreditPacksResponse>('/credit-packs');
  return response.data;
};

export interface CreateRazorpayOrderPayload {
  tierId: string;
}

export const createRazorpayOrder = async (data: CreateRazorpayOrderPayload) => {
  const response = await apiClient.post('/payment/order', data);
  return response.data;
};

export interface MockWebhookPayload {
  payment_id: number;
  gateway_txn_id: string;
  status: string;
}

export const triggerMockPaymentWebhook = async (data: MockWebhookPayload) => {
  const response = await apiClient.post('/payments/webhook', data);
  return response.data;
};

export const getMockPaymentDetails = async (paymentId: string | number) => {
  const response = await apiClient.get(`/payments/${paymentId}`);
  return response.data;
};
