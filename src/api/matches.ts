import apiClient from './client';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';
import { storage } from '../utils/storage';

// ── Contact shape returned after a successful reveal ──────────────
export interface UnlockedContact {
  ownerName: string;
  ownerMobile: string;
  ownerEmail: string | null;
}

// ── Match DTO from GET /user-matches ─────────────────────────────
export interface MatchDTO {
  id?: string;
  matchId?: number;        // canonical integer from matches.matchid
  matchid?: number;        // alternate casing from backend
  state?: string;          // 'matched' | 'pending_confirmation' | 'confirmed' | 'expired'
  currentBrokerConfirmed?: boolean;
  windowExpiresAt?: string | null;
  isRevealed?: boolean;
  propertyId?: string;
  propertyTitle?: string;
  matchScore?: number;
  quality?: string;
  ownerName?: string | null;
  ownerMobile?: string | null;
  ownerEmail?: string | null;
  locality?: string;
  city?: string;
  price?: any;
  createdAt?: string;
  unlockedContact?: UnlockedContact | null;
  connectionRequestId?: number | null;
  connectionRequestStatus?: 'pending' | 'accepted' | 'rejected' | 'expired' | 'credit_required' | string | null;
  deliveryChannel?: 'in_app' | 'whatsapp' | string | null;
  incomingConnectionRequest?: boolean;
  currentBrokerRole?: 'listing' | 'requirement' | string;
  notificationId?: string;
  [key: string]: any;
}

export interface MatchMediaDTO {
  mediaId: number;
  mediaType: 'image' | 'video';
  url: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
}

export interface MatchPropertyDetailDTO {
  listingId: number;
  transactionType?: string | null;
  propertyType?: string | null;
  configuration?: string | null;
  price?: number | null;
  priceUnit?: string | null;
  size?: number | null;
  sizes: Array<{ sizeSqft: number; label?: string | null }>;
  furnishing?: string | null;
  facing?: string | null;
  floorNumber?: number | null;
  status?: string | null;
  projectName?: string | null;
  locality?: string | null;
  roadInfo?: string | null;
  city?: string | null;
  description?: string | null;
  photoSharingPreference?: string | null;
  details: Record<string, unknown>;
  media: MatchMediaDTO[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MatchRequirementDetailDTO {
  requirementId: number;
  transactionType?: string | null;
  propertyType?: string | null;
  configurations: string[];
  budget?: number | null;
  budgetUnit?: string | null;
  size?: number | null;
  furnishingPreference?: string | null;
  facingPreference?: string | null;
  status?: string | null;
  city?: string | null;
  description?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MatchDetailDTO {
  matchId: number;
  listingId: number;
  requirementId: number;
  matchScore?: number | null;
  state: string;
  currentBrokerRole: string;
  currentBrokerConfirmed: boolean;
  isRevealed: boolean;
  connectionRequestStatus?: string | null;
  unlockedContact?: UnlockedContact | null;
  property: MatchPropertyDetailDTO;
  requirement: MatchRequirementDetailDTO;
}

export const getMatchDetails = async (matchId: number): Promise<MatchDetailDTO> => {
  const response = await apiClient.get<{ success: boolean; data: MatchDetailDTO }>(
    `/user-matches/matches/${matchId}/details`,
  );
  return response.data.data;
};

export const getAuthenticatedMediaSource = (relativeUrl: string) => {
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const path = relativeUrl.startsWith('/api/v1') ? relativeUrl : `/api/v1${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
  const token = storage.getString(STORAGE_KEYS.ACCESS_TOKEN);
  return {
    uri: `${origin}${path}`,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
};

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
  excellentMatches: number;
  goodMatches: number;
  fairMatches: number;
  unlockedMatches: number;
}

export interface GetMatchesResponse {
  matches: MatchDTO[];
  pagination: Pagination;
}

export interface BackendMatchesResponse {
  success: boolean;
  totalCount: number;
  excellentCount?: number;
  goodCount?: number;
  fairCount?: number;
  unlockedCount?: number;
  data: MatchDTO[];
}

export const getMatches = async (
  page: number = 1,
  limit: number = 20,
  transactionType?: string,
  listingId?: number,
  matchId?: number,
  requirementId?: number,
): Promise<GetMatchesResponse> => {
  try {
    let url = `/user-matches?page=${page}&limit=${limit}`;
    if (transactionType) {
      url += `&type=${transactionType}&transactionType=${transactionType}`;
    }
    if (listingId) {
      url += `&listingId=${encodeURIComponent(String(listingId))}`;
    }
    if (matchId) {
      url += `&matchId=${encodeURIComponent(String(matchId))}`;
    }
    if (requirementId) {
      url += `&requirementId=${encodeURIComponent(String(requirementId))}`;
    }
    console.log('Fetching matches from:', url);
    const response = await apiClient.get<BackendMatchesResponse>(url);
    console.log('Matches API Response Data:', JSON.stringify(response.data).substring(0, 500));

    const responsePayload: any = response.data;
    const matchesList: MatchDTO[] = Array.isArray(responsePayload)
      ? responsePayload
      : (responsePayload?.data || responsePayload?.matches || responsePayload?.items || responsePayload?.result || []);

    return {
      matches: matchesList,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalMatches: responsePayload?.totalCount || responsePayload?.total || matchesList.length,
        totalPages: Math.ceil((responsePayload?.totalCount || responsePayload?.total || matchesList.length) / limit) || 1,
        excellentMatches: responsePayload?.excellentCount ?? matchesList.filter(match => Number(match.matchScore ?? 0) >= 80).length,
        goodMatches: responsePayload?.goodCount ?? matchesList.filter(match => Number(match.matchScore ?? 0) >= 60 && Number(match.matchScore ?? 0) < 80).length,
        fairMatches: responsePayload?.fairCount ?? matchesList.filter(match => Number(match.matchScore ?? 0) < 60).length,
        unlockedMatches: responsePayload?.unlockedCount ?? matchesList.filter(match => match.isRevealed === true).length,
      }
    };
  } catch (error: any) {
    console.log('Matches API Error:', error.config?.url, error.response?.status, error.response?.data);
    throw error;
  }
};

// ── Step 1: Confirm & Connect (both brokers call this) ────────────
// Broker A calling this initiates the unlock (state → pending_confirmation)
// Broker B calling this completes the handshake (state → confirmed)
export interface ConfirmMatchPayload {
  matchId: number;
  availabilityConfirmed: boolean;
  priceValid: boolean;
  priceNegotiable: boolean;
  readyToConnect: boolean;
}

export interface ConfirmMatchResponse {
  success: boolean;
  message?: string;
  matchId?: number;
  state?: string;           // 'pending_confirmation' | 'confirmed'
  windowExpiresAt?: string; // ISO timestamp — show countdown to Broker A
  creditsRequired?: number;
  errorCode?: string | null;
  connectionRequestId?: number | null;
  connectionRequestStatus?: string | null;
  deliveryChannel?: string | null;
  deliveryStatus?: string | null;
  counterpartyRegistered?: boolean | null;
  isRevealed?: boolean;
  creditsRemaining?: number;
  unlockedContact?: UnlockedContact | null;
}

export const confirmMatch = async (matchId: number, data: ConfirmMatchPayload): Promise<ConfirmMatchResponse> => {
  const response = await apiClient.post<ConfirmMatchResponse>(
    `/user-matches/matches/${matchId}/confirm`,
    data
  );
  return response.data;
};

export type RejectReasonCode =
  | 'PROPERTY_UNAVAILABLE'
  | 'PRICE_CHANGED'
  | 'CLIENT_REQUIREMENT_CLOSED'
  | 'ALREADY_CLOSED'
  | 'INCORRECT_MATCH'
  | 'OTHER';

export interface RejectMatchPayload {
  matchId: number;
  connectionRequestId?: number | null;
  reasonCode: RejectReasonCode;
  reasonText?: string;
}

export interface RejectMatchResponse {
  success: boolean;
  message: string;
  matchId: number;
  connectionRequestId: number;
  connectionRequestStatus: 'rejected';
}

export const rejectMatch = async (matchId: number, data: RejectMatchPayload): Promise<RejectMatchResponse> => {
  const response = await apiClient.post<RejectMatchResponse>(
    `/user-matches/matches/${matchId}/reject`,
    data,
  );
  return response.data;
};

// ── Step 2: Reveal contacts (called after both confirmations) ─────
// Idempotent: safe to retry; will NOT deduct credits again if already revealed

// ── Unlocked matches history (Credits screen) ────────────────────
