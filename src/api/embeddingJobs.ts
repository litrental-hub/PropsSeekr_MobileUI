import apiClient from './client';

export type EmbeddingJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface EmbeddingJobResponse {
  success: boolean;
  job_id: string;
  entity_type: 'listing' | 'requirement';
  entity_id: number;
  status: EmbeddingJobStatus;
  attempt_count: number;
  max_attempts: number;
  completed_at?: string | null;
  last_error?: string | null;
}

export const getEmbeddingJob = async (jobId: string): Promise<EmbeddingJobResponse> => {
  const response = await apiClient.get<EmbeddingJobResponse>(`/embedding-jobs/${encodeURIComponent(jobId)}`);
  return response.data;
};

export const retryEmbeddingJob = async (jobId: string): Promise<{ success: boolean; job_id: string; status: EmbeddingJobStatus }> => {
  const response = await apiClient.post(`/embedding-jobs/${encodeURIComponent(jobId)}/retry`);
  return response.data;
};
