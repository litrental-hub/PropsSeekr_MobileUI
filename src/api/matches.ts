import apiClient from './client';

export interface UnlockedContact {
  ownerName: string;
  ownerMobile: string;
  ownerEmail: string;
}

export interface UnlockMatchPayload {
  propertyRequestId: string;
}

export interface UnlockMatchResponse {
  success: boolean;
  message: string;
  creditsRemaining: number;
  unlockedContact: UnlockedContact;
}

export interface MatchDTO {
  id: string;
  propertyId: string;
  propertyTitle: string;
  matchScore: number;
  quality: string;
  ownerName: string | null;
  ownerMobile: string | null;
  ownerEmail: string | null;
  locality: string;
  city: string;
  price: number;
  createdAt: string;
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
}

export interface GetMatchesResponse {
  matches: MatchDTO[];
  pagination: Pagination;
}

export interface BackendMatchesResponse {
  success: boolean;
  totalCount: number;
  data: MatchDTO[];
}

export const getMatches = async (userId: string, page: number = 1, limit: number = 20): Promise<GetMatchesResponse> => {
  try {
    const url = `/user-matches?userId=${userId}&page=${page}&limit=${limit}`;
    console.log('Fetching matches from:', url);
    const response = await apiClient.get<BackendMatchesResponse>(url);
    console.log('Matches API Response Data:', JSON.stringify(response.data).substring(0, 500));
    
    const responsePayload: any = response.data;
    const matchesList: MatchDTO[] = Array.isArray(responsePayload)
      ? responsePayload
      : (responsePayload?.data || responsePayload?.matches || responsePayload?.items || responsePayload?.result || []);

    // Map backend format to UI format
    return {
      matches: matchesList,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalMatches: responsePayload?.totalCount || responsePayload?.total || matchesList.length,
        totalPages: Math.ceil((responsePayload?.totalCount || responsePayload?.total || matchesList.length) / limit) || 1,
      }
    };
  } catch (error: any) {
    console.log('Matches API Error:', error.config?.url, error.response?.status, error.response?.data);
    throw error;
  }
};

export const unlockContact = async (data: UnlockMatchPayload): Promise<UnlockMatchResponse> => {
  const response = await apiClient.post<UnlockMatchResponse>('/user-matches/unlock', data);
  return response.data;
};
