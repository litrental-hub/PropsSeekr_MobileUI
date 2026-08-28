import apiClient from '../client';
import { addListing, getMyListings, searchProperties } from '../property';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

describe('getMyListings', () => {
  beforeEach(() => mockedGet.mockReset());

  it('calls the authenticated canonical broker listings endpoint', async () => {
    const payload = { success: true, totalCount: 0, page: 1, limit: 20, data: [] };
    mockedGet.mockResolvedValue({ data: payload });

    await expect(getMyListings()).resolves.toEqual(payload);
    expect(mockedGet).toHaveBeenCalledWith('/listings/mine?page=1&limit=20');
  });

  it('encodes optional listing filters', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, totalCount: 0, page: 2, limit: 10, data: [] } });

    await getMyListings(2, 10, { transactionType: 'BUY_SELL', status: 'UNDER REVIEW' });

    expect(mockedGet).toHaveBeenCalledWith(
      '/listings/mine?page=2&limit=10&transactionType=BUY_SELL&status=UNDER%20REVIEW',
    );
  });
});

describe('addListing', () => {
  beforeEach(() => mockedPost.mockReset());

  it('preserves RENT in the listing submission payload', async () => {
    const payload = {
      broker_id: 42,
      listing_type: 'RENT' as const,
      property_type: 'APARTMENT',
      locality: 'Pune',
      latitude: 18.5204,
      longitude: 73.8567,
      price: 25000,
      price_unit: 'PER_MONTH',
      floor_number: 4,
      project_name: 'Omaxe Hills',
      road_info: '60 ft road',
      price_status: 'NEGOTIABLE' as const,
      posted_by: 'BROKER',
      requirement_ids: [],
      sizes: [{ size_sqft: 1000, bhk: 1 }],
    };
    mockedPost.mockResolvedValue({ data: { success: true, listing_id: 101 } });

    await expect(addListing(payload)).resolves.toEqual({ success: true, listing_id: 101 });
    expect(mockedPost).toHaveBeenCalledWith('/listings', expect.objectContaining({
      listing_type: 'RENT',
      price_unit: 'PER_MONTH',
      floor_number: 4,
      project_name: 'Omaxe Hills',
      road_info: '60 ft road',
      price_status: 'NEGOTIABLE',
    }));
  });
});

describe('searchProperties', () => {
  beforeEach(() => mockedPost.mockReset());

  it('forwards canonical text, budget, and structured filters', async () => {
    mockedPost.mockResolvedValue({ data: { status: 'success', results: [], requirements: [], totalCount: 0, availableCount: 0, lookingCount: 0, page: 1, limit: 20 } });
    const payload = {
      transactionType: 'BUY_SELL' as const,
      listingType: 'SUPPLY' as const,
      category: 'RESIDENTIAL',
      location: { city: 'Indore', locality: 'Vijay Nagar', lat: 22.7533, lng: 75.8937, radiusKm: 5 },
      searchQuery: '2 BHK',
      budget: { min: 4000000, max: 6000000 },
      filters: { propertyTypes: ['APARTMENT'], configurations: ['2BHK'], categories: ['RESIDENTIAL'], budget: { min: 4000000, max: 6000000 } },
      pagination: { page: 1, limit: 20 },
    };

    await searchProperties(payload);

    expect(mockedPost).toHaveBeenCalledWith('/search/properties', expect.objectContaining({
      searchQuery: '2 BHK',
      budget: payload.budget,
      filters: payload.filters,
    }));
  });
});
