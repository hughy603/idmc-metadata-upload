import {
  mockAuthResponse,
  mockFailedAuthResponse,
  mockJobResponse,
  mockFailedJobResponse,
  mockJobStatusResponse,
  mockRunningJobStatusResponse,
  mockFailedJobStatusResponse,
} from '../../mocks/handlers';
import {
  authenticateWithInformatica,
  checkImportJobStatus,
  importMappingDocumentation,
  uploadMappingFile,
} from '@/lib/services/informatica-mapping-service';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// Helper to create proper Response objects for mocking
const createMockResponse = (
  ok: boolean,
  data: any,
  status = 200,
  statusText = 'OK'
) => {
  return {
    ok,
    status,
    statusText,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  };
};

describe('Informatica Mapping Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('authenticateWithInformatica', () => {
    it('should authenticate successfully', async () => {
      // Mock successful login response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(true, {
          sessionId: mockAuthResponse.sessionId,
          orgId: mockAuthResponse.orgId,
        })
      );

      // Mock successful token response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(true, { token: mockAuthResponse.token })
      );

      const result = await authenticateWithInformatica({
        username: 'testuser',
        password: 'testpass',
        baseUrl: 'https://test-base-url.com',
        apiUrl: 'https://test-api-url.com/api',
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://test-base-url.com/identity-service/api/v1/Login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            username: 'testuser',
            password: 'testpass',
          }),
        })
      );

      expect(result).toEqual({
        session: {
          sessionId: mockAuthResponse.sessionId,
          orgId: mockAuthResponse.orgId,
          apiUrl: 'https://test-api-url.com/api',
        },
        token: {
          token: mockAuthResponse.token,
          expiresAt: expect.any(Number),
        },
      });
    });

    it('should handle authentication failure', async () => {
      // Mock failed authentication response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(false, mockFailedAuthResponse, 401, 'Unauthorized')
      );

      await expect(
        authenticateWithInformatica({
          username: 'wronguser',
          password: 'wrongpass',
          baseUrl: 'https://test-base-url.com',
          apiUrl: 'https://test-api-url.com/api',
        })
      ).rejects.toThrow(
        `Login failed: ${JSON.stringify(mockFailedAuthResponse)}`
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        authenticateWithInformatica({
          username: 'testuser',
          password: 'testpass',
          baseUrl: 'https://test-base-url.com',
          apiUrl: 'https://test-api-url.com/api',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('importMappingDocumentation', () => {
    const mockSessionInfo = {
      sessionId: mockAuthResponse.sessionId,
      orgId: mockAuthResponse.orgId,
      apiUrl: 'https://test-api-url.com',
    };

    const mockAuthToken = {
      token: mockAuthResponse.token,
      expiresAt: Date.now() + 3600000,
    };

    const mockMappingData = [
      {
        sourceSystem: 'SourceSystem1',
        sourceTable: 'SourceTable1',
        sourceColumn: 'SourceColumn1',
        targetSystem: 'TargetSystem1',
        targetTable: 'TargetTable1',
        targetColumn: 'TargetColumn1',
        transformationLogic: 'TRIM()',
        businessTerm: 'CustomerID',
        description: 'Test description',
      },
    ];

    it('should import mapping documentation successfully', async () => {
      // Mock successful import response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(true, mockJobResponse)
      );

      const result = await importMappingDocumentation(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        mockMappingData
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        jobId: mockJobResponse.jobId,
      });
    });

    it('should handle import failure', async () => {
      // Mock failed import response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(false, mockFailedJobResponse, 400, 'Bad Request')
      );

      const result = await importMappingDocumentation(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        mockMappingData
      );

      expect(result).toEqual({
        success: false,
        error: `Failed to import mapping documentation: ${JSON.stringify(mockFailedJobResponse)}`,
      });
    });
  });

  describe('uploadMappingFile', () => {
    const mockSessionInfo = {
      sessionId: mockAuthResponse.sessionId,
      orgId: mockAuthResponse.orgId,
      apiUrl: 'https://test-api-url.com',
    };

    const mockAuthToken = {
      token: mockAuthResponse.token,
      expiresAt: Date.now() + 3600000,
    };

    const mockFile = new File(['test file content'], 'test-mapping.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    it('should upload mapping file successfully', async () => {
      // Mock successful upload response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(true, mockJobResponse)
      );

      const result = await uploadMappingFile(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        mockFile
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        jobId: mockJobResponse.jobId,
      });
    });

    it('should handle upload failure', async () => {
      // Mock failed upload response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(false, mockFailedJobResponse, 400, 'Bad Request')
      );

      const result = await uploadMappingFile(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        mockFile
      );

      expect(result).toEqual({
        success: false,
        error: `Failed to upload mapping file: ${JSON.stringify(mockFailedJobResponse)}`,
      });
    });
  });

  describe('checkImportJobStatus', () => {
    const mockSessionInfo = {
      sessionId: mockAuthResponse.sessionId,
      orgId: mockAuthResponse.orgId,
      apiUrl: 'https://test-api-url.com',
    };

    const mockAuthToken = {
      token: mockAuthResponse.token,
      expiresAt: Date.now() + 3600000,
    };

    it('should check job status successfully - completed', async () => {
      // Mock successful job status response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(true, mockJobStatusResponse)
      );

      const result = await checkImportJobStatus(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        'mock-job-id'
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        status: mockJobStatusResponse.status,
        isComplete: true,
      });
    });

    it('should check job status successfully - running', async () => {
      // Mock running job status response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(true, mockRunningJobStatusResponse)
      );

      const result = await checkImportJobStatus(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        'mock-job-id'
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        status: mockRunningJobStatusResponse.status,
        isComplete: false,
      });
    });

    it('should check job status successfully - failed', async () => {
      // Mock failed job status response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(true, mockFailedJobStatusResponse)
      );

      const result = await checkImportJobStatus(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        'mock-job-id'
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        status: mockFailedJobStatusResponse.status,
        isComplete: true,
        error: mockFailedJobStatusResponse.error,
      });
    });

    it('should handle job status check failure', async () => {
      // Mock failed job status check
      mockFetch.mockResolvedValueOnce(
        createMockResponse(false, { error: 'Job not found' }, 404, 'Not Found')
      );

      await expect(
        checkImportJobStatus(
          {
            session: mockSessionInfo,
            token: mockAuthToken,
          },
          'invalid-job-id'
        )
      ).rejects.toThrow(
        'Failed to check job status: {"error":"Job not found"}'
      );
    });
  });
});
