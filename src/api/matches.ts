import apiClient from './client';

// ── Contact shape returned after a successful reveal ──────────────
export interface UnlockedContact {
  ownerName: string;
  ownerMobile: string;
  ownerEmail: string | null;
}

// ── Match DTO from GET /user-matches ─────────────────────────────
export interface MatchDTO {
  id?: string;
  _id?: string;
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
  initiatorPropertyRequestId?: string;
  [key: string]: any;
}

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
        excellentMatches: responsePayload?.excellentCount ?? matchesList.filter(match => Number(match.matchScore ?? 0) >= 90).length,
        goodMatches: responsePayload?.goodCount ?? matchesList.filter(match => Number(match.matchScore ?? 0) >= 75 && Number(match.matchScore ?? 0) < 90).length,
        fairMatches: responsePayload?.fairCount ?? matchesList.filter(match => Number(match.matchScore ?? 0) < 75).length,
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
export interface RevealMatchPayload {
  matchId: number;
}

export interface RevealMatchResponse {
  success: boolean;
  message?: string;
  errorCode?: string;
  creditsRemaining?: number;
  unlockedContact: UnlockedContact | null;
}

export const revealMatch = async (matchId: number, data: RevealMatchPayload): Promise<RevealMatchResponse> => {
  const response = await apiClient.post<RevealMatchResponse>(
    `/user-matches/matches/${matchId}/reveal`,
    data
  );
  return response.data;
};

// ── Unlocked matches history (Credits screen) ────────────────────
export interface GetUnlockedMatchesResponse {
  success?: boolean;
  data?: any[];
  matches?: any[];
  [key: string]: any;
}

export const getUnlockedMatches = async (): Promise<any[]> => {
  const response = await apiClient.get<GetUnlockedMatchesResponse | any[]>('/user-matches/unlocked');
  const resData: any = response.data;
  if (Array.isArray(resData)) return resData;
  return resData?.data || resData?.matches || resData?.items || [];
};
