import { getCreditPacks } from '../../api/payment';
import {
  CREDIT_PACK_CACHE_TTL_MS,
  invalidateCreditPackCache,
  loadCreditPacks,
  mapCreditPackForDisplay,
  readCachedCreditPacks,
} from '../creditPacksCache';

jest.mock('../../api/payment', () => ({
  getCreditPacks: jest.fn(),
}));

const mockedGetCreditPacks = getCreditPacks as jest.MockedFunction<typeof getCreditPacks>;
const catalog = {
  success: true,
  packs: [{ id: 1, name: 'Growth', credits: 20, price: 5000 }],
};

describe('credit pack cache', () => {
  beforeEach(() => {
    invalidateCreditPackCache();
    mockedGetCreditPacks.mockReset();
    jest.restoreAllMocks();
  });

  it('persists the first response and avoids another request while fresh', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    mockedGetCreditPacks.mockResolvedValue(catalog);

    const first = await loadCreditPacks();
    const second = await loadCreditPacks();

    expect(first.packs).toEqual(catalog.packs);
    expect(second.isFresh).toBe(true);
    expect(readCachedCreditPacks()?.packs).toEqual(catalog.packs);
    expect(mockedGetCreditPacks).toHaveBeenCalledTimes(1);
  });

  it('keeps stale packs available when a background refresh fails', async () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    mockedGetCreditPacks.mockResolvedValueOnce(catalog);
    await loadCreditPacks();

    now.mockReturnValue(1_000 + CREDIT_PACK_CACHE_TTL_MS + 1);
    mockedGetCreditPacks.mockRejectedValueOnce(new Error('offline'));
    const fallback = await loadCreditPacks();

    expect(fallback.packs).toEqual(catalog.packs);
    expect(fallback.isFresh).toBe(false);
    expect(mockedGetCreditPacks).toHaveBeenCalledTimes(2);
  });

  it('maps the cached API model into the purchase view model', () => {
    expect(mapCreditPackForDisplay(catalog.packs[0])).toEqual(expect.objectContaining({
      id: '1',
      tierId: 'CREDITS_20',
      rawPrice: 5000,
      isPopular: true,
    }));
  });
});
