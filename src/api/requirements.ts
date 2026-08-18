import apiClient from './client';

export interface RequirementPayload {
  userId?: string;
  lookingFor?: string;
  listingType?: string;
  propertyType?: string;
  configuration?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  budget?: string;
  minBudgetNumeric?: number;
  maxBudgetNumeric?: number;
  clientNotes?: string;
  city?: string;
}

export const addRequirement = async (data: RequirementPayload) => {
  const response = await apiClient.post('/requirements/add', data);
  return response.data;
};

export const getMyRequirements = async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get('/requirements/mine', {
    params: { page, limit },
  });
  return response.data;
};
