import apiClient from './client';

export type NotificationType = 'BROKER_UNLOCK' | 'BROKER_ACCEPTED' | 'BROKER_REJECTED' | 'MATCH' | 'BROKER_REQUEST' | 'SYSTEM';

export interface NotificationItem {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  channelStatus?: string;
  actionStatus?: 'pending' | 'accepted' | 'rejected' | 'expired' | 'credit_required' | string | null;
  meta?: {
    matchId?: number;
    requestId?: number;
  };
}

export interface GetNotificationsResponse {
  success: boolean;
  unreadCount: number;
  totalCount: number;
  page: number;
  limit: number;
  data: NotificationItem[];
}

export const getNotifications = async (
  brokerId: string | number,
  page = 1,
  limit = 20,
  filter = 'ALL',
): Promise<GetNotificationsResponse> => {
  const response = await apiClient.get<GetNotificationsResponse>(
    `/brokers/${encodeURIComponent(String(brokerId))}/notifications?page=${page}&limit=${limit}&filter=${encodeURIComponent(filter)}`,
  );
  return response.data;
};

export interface DefaultResponse {
  success?: boolean;
  message?: string;
  unreadCount?: number;
}

export const markAsRead = async (
  brokerId: string | number,
  notificationId: string,
): Promise<DefaultResponse> => {
  const response = await apiClient.patch<DefaultResponse>(
    `/brokers/${encodeURIComponent(String(brokerId))}/notifications/${encodeURIComponent(notificationId)}/read`,
  );
  return response.data;
};

export const markAllAsRead = async (
  brokerId: string | number,
): Promise<DefaultResponse> => {
  const response = await apiClient.post<DefaultResponse>(
    `/brokers/${encodeURIComponent(String(brokerId))}/notifications/mark-all-read`,
  );
  return response.data;
};

export interface NotificationPreferences {
  whatsapp_enabled: boolean;
  in_app_enabled: boolean;
  reminder_frequency_cap_hours?: number;
}

export const getNotificationPreferences = async (brokerId: string | number): Promise<NotificationPreferences> => {
  const response = await apiClient.get<NotificationPreferences>(`/brokers/${brokerId}/notification-preferences`);
  return response.data;
};

export interface UpdateNotificationPreferencesPayload {
  whatsapp_enabled?: boolean;
  in_app_enabled?: boolean;
}

export const updateNotificationPreferences = async (brokerId: string | number, data: UpdateNotificationPreferencesPayload): Promise<NotificationPreferences> => {
  const response = await apiClient.patch<NotificationPreferences>(`/brokers/${brokerId}/notification-preferences`, data);
  return response.data;
};
