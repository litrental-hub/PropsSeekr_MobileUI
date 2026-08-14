import apiClient from './client';

export interface NotificationItem {
  notificationId: string;
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  contactUnlocked?: boolean;
  createdAt?: string;
  brokerName?: string;
  mobileNumber?: string;
  [key: string]: any;
}

export interface GetNotificationsResponse {
  status?: string;
  unreadCount?: number;
  data?: NotificationItem[];
}

export const getNotifications = async (
  userId: string,
  page = 1,
  limit = 20,
  filter = 'ALL'
): Promise<GetNotificationsResponse | NotificationItem[]> => {
  const response = await apiClient.get<GetNotificationsResponse | NotificationItem[]>(
    `/brokers/${encodeURIComponent(userId)}/notifications?page=${page}&limit=${limit}&filter=${encodeURIComponent(filter)}`
  );
  return response.data;
};

export interface MarkAsReadPayload {
  userId: string;
  notificationId: string;
}

export interface DefaultResponse {
  status?: string;
  message?: string;
}

export const markAsRead = async (payload: MarkAsReadPayload): Promise<DefaultResponse> => {
  const response = await apiClient.patch<DefaultResponse>(
    `/notifications/${encodeURIComponent(payload.notificationId)}/read`
  );
  return response.data;
};

export interface MarkAllAsReadPayload {
  userId: string;
}

export const markAllAsRead = async (payload: MarkAllAsReadPayload): Promise<DefaultResponse> => {
  const response = await apiClient.post<DefaultResponse>('/notifications/mark-all-read', payload);
  return response.data;
};

export interface UnlockContactPayload {
  userId: string;
  notificationId: string;
}

export interface UnlockedContactData {
  brokerName?: string;
  mobileNumber?: string;
  phone?: string;
  phoneNumber?: string;
  remainingCredits?: number;
  remainingTokens?: number;
  [key: string]: any;
}

export interface UnlockContactResponse {
  status?: string;
  data?: UnlockedContactData;
  message?: string;
  brokerName?: string;
  mobileNumber?: string;
  phone?: string;
  phoneNumber?: string;
  remainingCredits?: number;
  remainingTokens?: number;
  [key: string]: any;
}

export const unlockBroker = async (payload: UnlockContactPayload): Promise<UnlockContactResponse> => {
  const response = await apiClient.post<UnlockContactResponse>(
    `/notifications/${encodeURIComponent(payload.notificationId)}/unlock-broker?userId=${encodeURIComponent(payload.userId)}`
  );
  return response.data;
};
