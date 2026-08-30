import {
  buildMarketplacePayload,
  formatMarketplaceArea,
  formatMarketplaceDistance,
  formatMarketplacePrice,
} from '../marketplaceSearch';

const location = {
  city: 'Indore',
  locality: 'Vijay Nagar',
  lat: 22.7533,
  lng: 75.8937,
  radiusKm: 5,
};

describe('buildMarketplacePayload', () => {
  it('uses the nested API contract and the exact selected 5 km location', () => {
    expect(buildMarketplacePayload({
      transactionType: 'RENTAL',
      listingType: 'SUPPLY',
      location,
      filter: 'ALL',
      searchQuery: ' office ',
      page: 2,
    })).toEqual({
      transactionType: 'RENTAL',
      listingType: 'SUPPLY',
      category: '',
      location,
      searchQuery: 'office',
      budget: undefined,
      filters: {
        propertyTypes: [],
        configurations: [],
        categories: [],
        budget: {},
      },
      pagination: { page: 2, limit: 20 },
    });
  });

  it('maps BHK, commercial, plot, and villa choices to server filters', () => {
    const base = { transactionType: 'BUY_SELL' as const, listingType: 'DEMAND' as const, location, searchQuery: '', page: 1 };
    expect(buildMarketplacePayload({ ...base, filter: '2BHK' }).filters.configurations).toEqual(['2BHK']);
    expect(buildMarketplacePayload({ ...base, filter: 'COMMERCIAL' }).category).toBe('COMMERCIAL');
    expect(buildMarketplacePayload({ ...base, filter: 'PLOT' }).category).toBe('PLOT');
    expect(buildMarketplacePayload({ ...base, filter: 'VILLA' }).filters.propertyTypes).toEqual(['VILLA', 'BUNGALOW']);
  });

  it('sends the selected lakh budget as a maximum server-side budget filter', () => {
    const payload = buildMarketplacePayload({
      transactionType: 'BUY_SELL',
      listingType: 'SUPPLY',
      location,
      filter: '2BHK',
      searchQuery: '',
      budgetMax: 9_000_000,
      page: 1,
    });

    expect(payload.budget).toEqual({ min: undefined, max: 9_000_000 });
  });
});

describe('marketplace formatters', () => {
  it('never fabricates output for missing values', () => {
    expect(formatMarketplacePrice(null, true)).toBeNull();
    expect(formatMarketplaceArea(undefined)).toBeNull();
    expect(formatMarketplaceDistance(null)).toBeNull();
  });

  it('formats values returned by the database', () => {
    expect(formatMarketplacePrice(14000, true)).toBe('₹14,000/mo');
    expect(formatMarketplaceArea(950)).toBe('950 sqft');
    expect(formatMarketplaceDistance(1.236)).toBe('1.2 km');
  });
});
