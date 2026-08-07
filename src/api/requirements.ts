import apiClient from './client';

export interface RequirementPayload {
  transactionType?: string;
  category?: string;
  description?: string;
  minimumSize?: number;
  budgetMax?: number;
  city?: string;
  locality?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  configuration?: string;
  propertyType?: string;
  projectName?: string;
}

export const addRequirement = async (data: RequirementPayload) => {
  const response = await apiClient.post('/requirements', data);
  return response.data;
};

export const getMyRequirements = async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get('/requirements/mine', {
    params: { page, limit },
  });
  return response.data;
};
