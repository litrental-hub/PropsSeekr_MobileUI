import apiClient from './client';
import axios from 'axios';

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
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  transactionType?: string;
  category?: string;
  page?: number;
  limit?: number;
  listingType?: string;
  location?: LocationPayload;
  pagination?: PaginationPayload;
  [key: string]: any;
}

export interface SearchPropertiesResponse {
  results?: any[];
  data?: any[];
  requirements?: any[];
  totalCount?: number;
  availableCount?: number;
  activeCount?: number;
  lookingCount?: number;
  [key: string]: any;
}

export const searchProperties = async (data: SearchPropertiesPayload): Promise<SearchPropertiesResponse> => {
  const response = await apiClient.post<SearchPropertiesResponse>('/search/properties', data);
  return response.data;
};


// ── Property Inventory ──────────────────────────────────────────
export interface AddListingPayload {
  broker_id: number;
  listing_type: 'RENT' | 'SELL';
  property_type: string;
  locality: string;
  price: number;
  price_unit?: string;
  configuration?: string;
  size?: number;
  furnishing?: string;
  facing?: string;
  project_name?: string;
  city?: string;
  raw_message_text?: string;
  posted_by: string;
  requirement_ids: number[];
  sizes: Array<{ size_sqft: number; bhk: number }>;
}

export interface AddListingResponse {
  success?: boolean;
  listing_id?: number;
  message?: string;
  // legacy fallback
  status?: string;
  listingId?: string;
}

export const addListing = async (data: AddListingPayload): Promise<AddListingResponse> => {
  const response = await apiClient.post<AddListingResponse>('/listings', data);
  return response.data;
};

export interface PropertyListingItem {
  id: string;
  listingId: number;
  title: string;
  type: 'RENTAL' | 'BUY/SELL' | string;
  transactionType: 'RENTAL' | 'BUY_SELL' | string;
  listingType: string;
  propertyType: string;
  configuration: string;
  locality: string;
  location: string;
  city: string;
  price: number | null;
  priceUnit?: string | null;
  builtUpSize?: number | null;
  sizes: Array<{ label: string; sizeSqft: number }>;
  views: number | null;
  matchCount: number;
  status: 'Active' | 'Under Review' | 'Rented' | 'Sold' | string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GetMyListingsResponse {
  success: boolean;
  totalCount: number;
  page: number;
  limit: number;
  data: PropertyListingItem[];
}

export interface MyListingsFilters {
  transactionType?: 'RENTAL' | 'BUY_SELL';
  status?: string;
}

export const getMyListings = async (
  page = 1,
  limit = 20,
  filters: MyListingsFilters = {},
): Promise<GetMyListingsResponse> => {
  const query = [
    `page=${page}`,
    `limit=${limit}`,
    filters.transactionType ? `transactionType=${encodeURIComponent(filters.transactionType)}` : '',
    filters.status ? `status=${encodeURIComponent(filters.status)}` : '',
  ].filter(Boolean).join('&');
  const response = await apiClient.get<GetMyListingsResponse>(`/listings/mine?${query}`);
  return response.data;
};

// ── Bulk File Upload (AWS Presigned S3 PUT) ──────────────────────
export const uploadBulkTxtFile = async (fileUri: string, fileName: string): Promise<string> => {
  // 1. Validate file extension
  if (!fileName.toLowerCase().endsWith('.txt')) {
    throw new Error('Invalid file type. Only .txt (plain text) files are allowed.');
  }

  // 2. Request presigned upload URL from AWS API Gateway
  const initRes = await axios.post(
    'https://73t761f5q5.execute-api.ap-south-1.amazonaws.com/default/propseekr-file-processor/upload',
    { fileName: fileName },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const uploadUrl = initRes.data?.uploadUrl || initRes.data?.url || (typeof initRes.data === 'string' ? initRes.data : null);
  if (!uploadUrl || typeof uploadUrl !== 'string') {
    throw new Error('Failed to retrieve a valid presigned upload URL from the server.');
  }

  // 3. Read local file text content
  const localResponse = await fetch(fileUri);
  const fileText = await localResponse.text();

  // 4. Upload file to S3 via PUT with Content-Type: text/plain
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: fileText,
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
  }

  return uploadUrl;
};

// ── Additional Listing Endpoints (Entire Flow) ───────────────────

export interface IngestWhatsappListingPayload {
  broker_id: number;
  property_type: string;
  locality: string;
  price: number;
  raw_message_text: string;
  source: string;
  sizes: Array<{ size_sqft: number; bhk?: number }>;
  city?: string;
}

export const ingestWhatsappListing = async (data: IngestWhatsappListingPayload) => {
  const response = await apiClient.post('/listings/whatsapp-intake', data);
  return response.data;
};

export const getListingDetails = async (listingId: string | number) => {
  const response = await apiClient.get(`/listings/${listingId}`);
  return response.data;
};

export const linkListingAndRequirement = async (listingId: string | number, requirementId: string | number) => {
  const response = await apiClient.post(`/listings/${listingId}/requirements/${requirementId}`);
  return response.data;
};

export const removeListingRequirementLink = async (listingId: string | number, requirementId: string | number) => {
  const response = await apiClient.delete(`/listings/${listingId}/requirements/${requirementId}`);
  return response.data;
};

export const getListingRequirements = async (listingId: string | number) => {
  const response = await apiClient.get(`/listings/${listingId}/requirements`);
  return response.data;
};

export const getListingMetrics = async () => {
  const response = await apiClient.get('/listings/metrics');
  return response.data;
};
