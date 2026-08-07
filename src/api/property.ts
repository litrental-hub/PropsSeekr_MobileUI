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
  propertyType?: string;
  bhk?: string;
  buildingName?: string;
  locality?: string;
  price?: number | string;
  areaSqFt?: number | string;
  isFurnished?: boolean;
  availableFrom?: string;
  [key: string]: any;
}

export interface AddListingResponse {
  status?: string;
  listingId?: string;
  message?: string;
}

export const addListing = async (data: AddListingPayload): Promise<AddListingResponse> => {
  const response = await apiClient.post<AddListingResponse>('/property-inventory/listings', data);
  return response.data;
};

export interface PropertyListingItem {
  listingId?: string;
  id?: string;
  title?: string;
  bhk?: string;
  buildingName?: string;
  locality?: string;
  location?: string;
  price?: number | string;
  views?: number;
  leads?: number;
  matches?: number;
  status?: 'Active' | 'Under Review' | 'Rented' | 'Sold' | string;
  type?: 'RENTAL' | 'BUY/SELL' | string;
  [key: string]: any;
}

export interface GetMyListingsResponse {
  status?: string;
  totalCount?: number;
  listings?: PropertyListingItem[];
  data?: PropertyListingItem[];
}

export const getMyListings = async (page = 1, limit = 20): Promise<GetMyListingsResponse | PropertyListingItem[]> => {
  const response = await apiClient.get<GetMyListingsResponse | PropertyListingItem[]>(`/property-inventory/my-listings?page=${page}&limit=${limit}`);
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
