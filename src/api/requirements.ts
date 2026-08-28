import apiClient from './client';

export interface RequirementPayload {
  transactionType: 'RENTAL' | 'BUY_SELL';
  category: string;
  propertyType: string;
  configurations: string[];
  description: string;
  budgetMax: number;
  budgetMin?: number;
  budgetType?: 'FIXED' | 'FLEXIBLE' | 'NOBUDGET';
  minimumSize: number;
  maximumSize?: number;
  city: string;
  locality: string;
  lat: number;
  lng: number;
  radiusKm: number;
  preferredLocations?: Array<{
    city: string;
    locality: string;
    lat: number;
    lng: number;
  }>;
  preferredProjectNames?: string[];
  furnishingPreference?: string;
  facingPreference?: string;
  additionalNotes?: string;
}

export const addRequirement = async (data: RequirementPayload) => {
  const response = await apiClient.post('/requirements', data);
  return response.data;
};

export const getMyRequirements = async (
  page: number = 1,
  limit: number = 20,
  transactionType?: 'RENTAL' | 'BUY_SELL',
) => {
  const response = await apiClient.get('/requirements/mine', {
    params: { page, limit, transactionType },
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

export const createRequirement = async (payload: CreateRequirementPayload) => {
  const response = await apiClient.post('/requirements/create', payload);
  return response.data;
};

export const getRequirementListings = async (requirementId: string | number) => {
  const response = await apiClient.get(`/requirements/${requirementId}/listings`);
  return response.data;
};
