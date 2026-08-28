import { CreditPack, getCreditPacks } from '../api/payment';
import { storage } from '../utils/storage';

const CACHE_KEY = 'credit_packs_cache_v1';
export const CREDIT_PACK_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CreditPackCacheRecord {
  version: 1;
  cachedAt: number;
  packs: CreditPack[];
}

export interface CachedCreditPacks {
  packs: CreditPack[];
  cachedAt: number;
  isFresh: boolean;
}

export interface CreditPackViewModel {
  id: string;
  tierId: string;
  name: string;
  credits: number;
  rateText: string;
  price: string;
  saving: string | null;
  isPopular: boolean;
  rawPrice: number;
}

let inFlightRequest: Promise<CachedCreditPacks> | null = null;

const normalizePacks = (value: unknown): CreditPack[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Partial<CreditPack>;
    const id = Number(candidate.id);
    const credits = Number(candidate.credits);
    const price = Number(candidate.price);
    const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
    if (!Number.isFinite(id) || !Number.isFinite(credits) || !Number.isFinite(price) || credits <= 0 || price < 0 || !name) {
      return [];
    }
    return [{ id, name, credits, price }];
  });
};

export const readCachedCreditPacks = (now = Date.now()): CachedCreditPacks | null => {
  const serialized = storage.getString(CACHE_KEY);
  if (!serialized) return null;
  try {
    const record = JSON.parse(serialized) as Partial<CreditPackCacheRecord>;
    const packs = normalizePacks(record.packs);
    if (record.version !== 1 || typeof record.cachedAt !== 'number' || !Number.isFinite(record.cachedAt) || packs.length === 0) {
      storage.remove(CACHE_KEY);
      return null;
    }
    return {
      packs,
      cachedAt: record.cachedAt,
      isFresh: now - record.cachedAt < CREDIT_PACK_CACHE_TTL_MS,
    };
  } catch {
    storage.remove(CACHE_KEY);
    return null;
  }
};

export const loadCreditPacks = async (forceRefresh = false): Promise<CachedCreditPacks> => {
  const cached = readCachedCreditPacks();
  if (!forceRefresh && cached?.isFresh) return cached;
  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = (async () => {
    try {
      const response = await getCreditPacks();
      const rawPacks = Array.isArray(response) ? response : response?.packs;
      const packs = normalizePacks(rawPacks);
      if (packs.length === 0) throw new Error('No token packs are currently available.');
      const record: CreditPackCacheRecord = { version: 1, cachedAt: Date.now(), packs };
      storage.set(CACHE_KEY, JSON.stringify(record));
      return { ...record, isFresh: true };
    } catch (error) {
      if (cached) return cached;
      throw error;
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
};

export const mapCreditPackForDisplay = (pack: CreditPack): CreditPackViewModel => ({
  id: String(pack.id),
  tierId: `CREDITS_${pack.credits}`,
  name: pack.name,
  credits: pack.credits,
  rateText: `₹${(pack.price / pack.credits).toFixed(0)} per token`,
  price: `₹${pack.price.toLocaleString('en-IN')}`,
  saving: pack.credits >= 20 ? 'Popular' : null,
  isPopular: pack.credits === 20 || pack.name.toLowerCase().includes('growth'),
  rawPrice: pack.price,
});

export const mapCreditPacksForDisplay = (packs: CreditPack[]): CreditPackViewModel[] =>
  packs.map(mapCreditPackForDisplay);

export const invalidateCreditPackCache = (): void => {
  storage.remove(CACHE_KEY);
};
