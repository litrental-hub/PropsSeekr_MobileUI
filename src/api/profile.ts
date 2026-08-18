import apiClient from './client';

export interface ProfileData {
  userId?: string;
  name?: string;
  fullName?: string;
  profilePhotoUrl?: string;
  avatarUrl?: string;
  mobileNumber?: string;
  email?: string;
  companyName?: string;
  companyGst?: string;
  companyAddress?: string;
  isReraVerified?: boolean;
  availableCredits?: number;
  [key: string]: any;
}

export interface GetProfileResponse {
  status?: string;
  data?: ProfileData;
}

export const getProfile = async (brokerId: string | number): Promise<ProfileData | null> => {
  const response = await apiClient.get<GetProfileResponse | ProfileData>(`/brokers/${brokerId}`);
  const resData = response.data;
  if (resData && 'data' in resData && resData.data) {
    return resData.data;
  }
  return resData as ProfileData;
};

export interface UpdateProfilePayload {
  name?: string;
  mobileNumber?: string;
  locality?: string;
  brokerageName?: string;
  [key: string]: any;
}

export interface UpdateProfileResponse {
  status?: string;
  message?: string;
  [key: string]: any;
}

export const updateProfile = async (brokerId: string | number, data: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
  const response = await apiClient.patch<UpdateProfileResponse>(`/brokers/${brokerId}`, data);
  return response.data;
};

export interface UploadPhotoResponse {
  status?: string;
  profilePhotoUrl?: string;
  url?: string;
  message?: string;
  [key: string]: any;
}

export const uploadProfilePhoto = async (fileUri: string, fileName = 'profile_photo.jpg', fileType = 'image/jpeg'): Promise<UploadPhotoResponse> => {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: fileType,
  } as any);

  const response = await apiClient.post<UploadPhotoResponse>('/profile/upload-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

