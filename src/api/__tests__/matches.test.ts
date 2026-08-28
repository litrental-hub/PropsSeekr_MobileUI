import apiClient from '../client';
import { confirmMatch, getMatchDetails, getMatches, rejectMatch } from '../matches';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

describe('getMatches', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('requests listing-specific matches and preserves server aggregate counts', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        totalCount: 114,
        excellentCount: 100,
        goodCount: 10,
        fairCount: 4,
        unlockedCount: 2,
        data: Array.from({ length: 20 }, (_, index) => ({ matchId: index + 1 })),
      },
    });

    const result = await getMatches(1, 20, 'RENTAL', 73690);

    expect(mockedGet).toHaveBeenCalledWith(
      '/user-matches?page=1&limit=20&type=RENTAL&transactionType=RENTAL&listingId=73690',
    );
    expect(result.matches).toHaveLength(20);
    expect(result.pagination).toMatchObject({
      totalMatches: 114,
      totalPages: 6,
      excellentMatches: 100,
      goodMatches: 10,
      fairMatches: 4,
      unlockedMatches: 2,
    });
  });

  it('requests one exact match for notification deep links', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        totalCount: 1,
        data: [{ matchId: 500, state: 'pending_confirmation' }],
      },
    });

    const result = await getMatches(1, 20, undefined, undefined, 500);

    expect(mockedGet).toHaveBeenCalledWith('/user-matches?page=1&limit=20&matchId=500');
    expect(result.matches).toEqual([
      expect.objectContaining({ matchId: 500, state: 'pending_confirmation' }),
    ]);
  });

  it('requests requirement-specific matches without treating the requirement as a listing', async () => {
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        totalCount: 707,
        data: Array.from({ length: 20 }, (_, index) => ({ matchId: index + 1 })),
      },
    });

    const result = await getMatches(1, 20, 'BUY_SELL', undefined, undefined, 25186);

    expect(mockedGet).toHaveBeenCalledWith(
      '/user-matches?page=1&limit=20&type=BUY_SELL&transactionType=BUY_SELL&requirementId=25186',
    );
    expect(result.pagination.totalMatches).toBe(707);
  });

  it('uses the mutual confirmation route and preserves request delivery state', async () => {
    mockedPost.mockResolvedValue({
      data: {
        success: true,
        matchId: 500,
        state: 'pending_confirmation',
        connectionRequestId: 91,
        connectionRequestStatus: 'pending',
        deliveryChannel: 'whatsapp',
        deliveryStatus: 'planned',
      },
    });
    const payload = {
      matchId: 500,
      availabilityConfirmed: true,
      priceValid: true,
      priceNegotiable: false,
      readyToConnect: true,
    };

    const result = await confirmMatch(500, payload);

    expect(mockedPost).toHaveBeenCalledWith('/user-matches/matches/500/confirm', payload);
    expect(result).toMatchObject({ connectionRequestId: 91, deliveryStatus: 'planned' });
  });

  it('loads the database-backed detail projection for an exact match', async () => {
    const detail = {
      matchId: 500,
      isRevealed: false,
      property: { media: [], details: {} },
      requirement: { configurations: [] },
    };
    mockedGet.mockResolvedValue({ data: { success: true, data: detail } });

    await expect(getMatchDetails(500)).resolves.toEqual(detail);
    expect(mockedGet).toHaveBeenCalledWith('/user-matches/matches/500/details');
  });

  it('rejects a pending request with a structured reason', async () => {
    mockedPost.mockResolvedValue({ data: { success: true, matchId: 500, connectionRequestId: 91, connectionRequestStatus: 'rejected' } });
    const payload = { matchId: 500, connectionRequestId: 91, reasonCode: 'PRICE_CHANGED' as const };

    await rejectMatch(500, payload);

    expect(mockedPost).toHaveBeenCalledWith('/user-matches/matches/500/reject', payload);
  });
});
