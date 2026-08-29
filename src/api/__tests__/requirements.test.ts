import apiClient from '../client';
import { addRequirement, getMyRequirements, updateRequirement } from '../requirements';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;
const mockedPatch = apiClient.patch as jest.Mock;

describe('getMyRequirements', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
  });

  it('passes the selected transaction filter to the API', async () => {
    mockedGet.mockResolvedValue({ data: { success: true, data: [] } });

    await getMyRequirements(1, 20, 'RENTAL');

    expect(mockedGet).toHaveBeenCalledWith('/requirements/mine', {
      params: { page: 1, limit: 20, transactionType: 'RENTAL' },
    });
  });

  it('submits requirements to the implemented backend route', async () => {
    mockedPost.mockResolvedValue({ data: { success: true, requirementId: '1' } });
    const payload = {
      transactionType: 'RENTAL' as const,
      category: 'RESIDENTIAL',
      propertyType: 'APARTMENT',
      configurations: ['2 BHK'],
      description: 'Wants to Rent 2 BHK Flat / Apartment',
      budgetMin: 30000,
      budgetMax: 50000,
      budgetType: 'FIXED' as const,
      minimumSize: 1000,
      maximumSize: 1400,
      city: 'Indore',
      locality: 'Vijay Nagar, Indore',
      lat: 22.75,
      lng: 75.89,
      radiusKm: 5,
      preferredLocations: [
        { city: 'Indore', locality: 'Vijay Nagar', lat: 22.75, lng: 75.89 },
        { city: 'Indore', locality: 'Palasia', lat: 22.725, lng: 75.883 },
      ],
      preferredProjectNames: ['Omaxe Hills'],
    };

    await addRequirement(payload);

    expect(mockedPost).toHaveBeenCalledWith('/requirements', payload);
  });

  it('keeps the API response job identity available to the form', async () => {
    mockedPatch.mockResolvedValue({ data: { success: true, embeddingJobId: 'job-123' } });

    const result = await updateRequirement(42, {
      transactionType: 'RENTAL', category: 'RESIDENTIAL', propertyType: 'APARTMENT', configurations: [], description: 'Need a flat', budgetMax: 50000, minimumSize: 900, city: 'Indore', locality: 'Vijay Nagar', lat: 22.75, lng: 75.89, radiusKm: 5,
    });

    expect(result.embeddingJobId).toBe('job-123');
    expect(mockedPatch).toHaveBeenCalledWith('/requirements/42', expect.any(Object));
  });
});
