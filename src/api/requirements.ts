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

// ── Additional Requirement Endpoints (Entire Flow) ───────────────────

export interface CreateRequirementPayload {
  broker_id: number;
  requirement_type: string;
  property_type: string;
  budget: number;
  budget_unit: string;
  size: number;
  locality_ids: number[];
  configurations: string[];
  posted_by?: string;
  listing_ids?: number[];
  city?: string;
}

export const createRequirement = async (data: CreateRequirementPayload) => {
  const response = await apiClient.post('/requirements', data);
  return response.data;
};

export const getRequirementListings = async (requirementId: string | number) => {
  const response = await apiClient.get(`/requirements/${requirementId}/listings`);
  return response.data;
};
