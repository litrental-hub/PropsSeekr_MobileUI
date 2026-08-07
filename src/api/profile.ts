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

export const getProfile = async (): Promise<ProfileData | null> => {
  const response = await apiClient.get<GetProfileResponse | ProfileData>('/profile');
  const resData = response.data;
  if (resData && 'data' in resData && resData.data) {
    return resData.data;
  }
  return resData as ProfileData;
};

export interface UpdateProfilePayload {
  name?: string;
  fullName?: string;
  email?: string;
  profilePhotoUrl?: string;
  avatarUrl?: string;
  agencyName?: string;
  gstNumber?: string;
  officeAddress?: string;
  companyName?: string;
  companyGst?: string;
  companyAddress?: string;
  [key: string]: any;
}

export interface UpdateProfileResponse {
  status?: string;
  message?: string;
  [key: string]: any;
}

export const updateProfile = async (data: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
  const response = await apiClient.put<UpdateProfileResponse>('/profile', data);
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

