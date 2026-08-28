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

export type MarketplaceTransactionType = 'RENTAL' | 'BUY_SELL';
export type MarketplaceListingType = 'SUPPLY' | 'DEMAND';

export interface BudgetPayload {
  min?: number;
  max?: number;
}

export interface MarketplaceFiltersPayload {
  propertyTypes: string[];
  configurations: string[];
  categories: string[];
  budget: BudgetPayload;
}

export interface SearchPropertiesPayload {
  transactionType: MarketplaceTransactionType;
  listingType: MarketplaceListingType;
  category: string;
  location: LocationPayload;
  searchQuery: string;
  budget?: BudgetPayload;
  filters: MarketplaceFiltersPayload;
  pagination: PaginationPayload;
}

export interface MarketplaceFeature {
  icon: string;
  label: string;
}

export interface MarketplaceListing {
  id: string;
  listingType: 'SUPPLY';
  transactionType: MarketplaceTransactionType;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  propertyType?: string | null;
  bhk?: string | null;
  status?: string | null;
  price?: number | null;
  priceUnit?: string | null;
  builtUpSize?: number | null;
  createdAt?: string | null;
  lastRefreshedAt?: string | null;
  freshnessCategory?: string | null;
  isNearby: boolean;
  distanceKm?: number | null;
  locationLabel?: string | null;
  locality?: string | null;
  city?: string | null;
  furnishing?: string | null;
  facing?: string | null;
  floorNumber?: number | null;
  projectName?: string | null;
  roadInfo?: string | null;
  features: MarketplaceFeature[];
}

export interface MarketplaceRequirement {
  id: string;
  listingType: 'DEMAND';
  transactionType: MarketplaceTransactionType;
  title: string;
  sub?: string | null;
  propertyType?: string | null;
  configurations: string[];
  budget?: number | null;
  budgetUnit?: string | null;
  requiredSize?: number | null;
  furnishingPreference?: string | null;
  facingPreference?: string | null;
  status?: string | null;
  locality?: string | null;
  city?: string | null;
  distanceKm?: number | null;
  createdAt?: string | null;
  lastRefreshedAt?: string | null;
  freshnessCategory?: string | null;
}

export interface SearchPropertiesResponse {
  status: string;
  results: MarketplaceListing[];
  requirements: MarketplaceRequirement[];
  totalCount: number;
  availableCount: number;
  lookingCount: number;
  page: number;
  limit: number;
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
  floor_number?: number;
  project_name?: string;
  road_info?: string;
  price_status?: 'FIXED' | 'NEGOTIABLE';
  city?: string;
  latitude: number;
  longitude: number;
  raw_message_text?: string;
  posted_by: string;
  requirement_ids: number[];
  sizes: Array<{ size_sqft: number; bhk: number }>;
  photo_sharing_preference?: string;
  details?: Record<string, unknown>;
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

export interface UploadableListingMedia {
  uri: string;
  fileName: string;
  mimeType: string;
}

export const uploadListingMedia = async (listingId: number, media: UploadableListingMedia[]) => {
  if (media.length === 0) return { success: true, media: [] };

  const uploaded: unknown[] = [];
  for (const item of media) {
    const formData = new FormData();
    formData.append('files', {
      uri: item.uri,
      name: item.fileName,
      type: item.mimeType,
    } as any);

    const response = await apiClient.post(`/listings/${listingId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    uploaded.push(...(response.data?.media || []));
  }
  return { success: true, media: uploaded };
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

  // 2. Request a presigned URL from MobileAPI. The response also includes the
  // exact S3 bucket/key needed to start processing after the PUT succeeds.
  const initRes = await apiClient.post('/file-processor/upload', { fileName });

  const uploadUrl = initRes.data?.uploadUrl || initRes.data?.url || (typeof initRes.data === 'string' ? initRes.data : null);
  const key = initRes.data?.key;
  if (!uploadUrl || typeof uploadUrl !== 'string') {
    throw new Error('Failed to retrieve a valid presigned upload URL from the server.');
  }
  if (!key) {
    throw new Error('The upload response did not include the file processing reference.');
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

  // 5. Explicit completion callback. This replaces the former S3 -> Lambda
  // trigger and starts process -> ingest -> embeddings -> matching only after
  // S3 has confirmed that the file is fully uploaded.
  await apiClient.post(
    '/file-processor/pipeline',
    { key },
    { timeout: 10 * 60 * 1000 },
  );

  return key;
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
