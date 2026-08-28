import {
  LocationPayload,
  MarketplaceListingType,
  MarketplaceTransactionType,
  SearchPropertiesPayload,
} from '../api/property';

export type MarketplaceFilter =
  | 'ALL'
  | '1BHK'
  | '2BHK'
  | '3BHK'
  | '4BHK'
  | 'COMMERCIAL'
  | 'PLOT'
  | 'VILLA';

export interface MarketplaceFilterOption {
  value: MarketplaceFilter;
  label: string;
}

export const MARKETPLACE_FILTERS: MarketplaceFilterOption[] = [
  { value: 'ALL', label: 'All' },
  { value: '1BHK', label: '1 BHK' },
  { value: '2BHK', label: '2 BHK' },
  { value: '3BHK', label: '3 BHK' },
  { value: '4BHK', label: '4 BHK' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'PLOT', label: 'Plot / Land' },
  { value: 'VILLA', label: 'Villa' },
];

interface BuildMarketplacePayloadArgs {
  transactionType: MarketplaceTransactionType;
  listingType: MarketplaceListingType;
  location: LocationPayload;
  filter: MarketplaceFilter;
  searchQuery: string;
  page: number;
  limit?: number;
  budgetMin?: number;
  budgetMax?: number;
}

export function buildMarketplacePayload({
  transactionType,
  listingType,
  location,
  filter,
  searchQuery,
  page,
  limit = 20,
  budgetMin,
  budgetMax,
}: BuildMarketplacePayloadArgs): SearchPropertiesPayload {
  const configurations = filter.endsWith('BHK') ? [filter] : [];
  const propertyTypes = filter === 'VILLA' ? ['VILLA', 'BUNGALOW'] : [];
  const category = filter === 'COMMERCIAL'
    ? 'COMMERCIAL'
    : filter === 'PLOT'
      ? 'PLOT'
      : filter === 'ALL'
        ? ''
        : 'RESIDENTIAL';

  return {
    transactionType,
    listingType,
    category,
    location,
    searchQuery: searchQuery.trim(),
    budget: budgetMin !== undefined || budgetMax !== undefined
      ? { min: budgetMin, max: budgetMax }
      : undefined,
    filters: {
      propertyTypes,
      configurations,
      categories: [],
      budget: {},
    },
    pagination: { page, limit },
  };
}

export function formatMarketplacePrice(value?: number | null, isRental = false): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const amount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  return isRental ? `₹${amount}/mo` : `₹${amount}`;
}

export function formatMarketplaceArea(value?: number | null): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)} sqft`;
}

export function formatMarketplaceDistance(value?: number | null): string | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return `${value.toFixed(1)} km`;
}

export function formatMarketplaceFreshness(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const elapsedMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
