import apiClient from '../client';
import { getNotifications, markAllAsRead, markAsRead } from '../notifications';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPatch = apiClient.patch as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

describe('broker notifications API', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPatch.mockReset();
    mockedPost.mockReset();
  });

  it('uses the numeric broker endpoint and returns the match identity', async () => {
    const response = {
      success: true,
      unreadCount: 1,
      totalCount: 1,
      page: 1,
      limit: 20,
      data: [{
        notificationId: '91',
        type: 'BROKER_UNLOCK',
        title: 'Match Unlock Request',
        message: 'Another broker wants to connect.',
        isRead: false,
        createdAt: '2026-08-24T10:00:00Z',
        meta: { matchId: 500 },
      }],
    };
    mockedGet.mockResolvedValue({ data: response });

    await expect(getNotifications(2, 1, 20, 'BROKER_REQUESTS')).resolves.toEqual(response);
    expect(mockedGet).toHaveBeenCalledWith(
      '/brokers/2/notifications?page=1&limit=20&filter=BROKER_REQUESTS',
    );
  });

  it('marks one or all broker notifications as read using the canonical routes', async () => {
    mockedPatch.mockResolvedValue({ data: { success: true, unreadCount: 0 } });
    mockedPost.mockResolvedValue({ data: { success: true, unreadCount: 0 } });

    await markAsRead(2, '91');
    await markAllAsRead(2);

    expect(mockedPatch).toHaveBeenCalledWith('/brokers/2/notifications/91/read');
    expect(mockedPost).toHaveBeenCalledWith('/brokers/2/notifications/mark-all-read');
  });
});
