import apiClient from '../client';
import { getEmbeddingJob, retryEmbeddingJob } from '../embeddingJobs';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedGet = apiClient.get as jest.Mock;
const mockedPost = apiClient.post as jest.Mock;

describe('embedding job API', () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('gets the owner-authorized job status using an encoded job id', async () => {
    const result = { success: true, job_id: 'job/id', status: 'queued' };
    mockedGet.mockResolvedValue({ data: result });

    await expect(getEmbeddingJob('job/id')).resolves.toEqual(result);
    expect(mockedGet).toHaveBeenCalledWith('/embedding-jobs/job%2Fid');
  });

  it('retries only through the canonical job retry route', async () => {
    mockedPost.mockResolvedValue({ data: { success: true, job_id: 'abc', status: 'queued' } });

    await retryEmbeddingJob('abc');
    expect(mockedPost).toHaveBeenCalledWith('/embedding-jobs/abc/retry');
  });
});
