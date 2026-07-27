import apiClient from './client';

export interface LocationPayload {
  city: string;
  locality: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface PaginationPayload {
  page: number;
  limit: number;
}

export interface SearchPropertiesPayload {
  transactionType: string;
  listingType: string;
  category: string;
  location: LocationPayload;
  pagination: PaginationPayload;
}

export interface SearchPropertiesResponse {
  results: any[]; // Adjust to match the specific result DTO if needed
  totalCount: number;
}

export const searchProperties = async (data: SearchPropertiesPayload): Promise<SearchPropertiesResponse> => {
  const response = await apiClient.post<SearchPropertiesResponse>('/property-requests/search', data);
  return response.data;
};
