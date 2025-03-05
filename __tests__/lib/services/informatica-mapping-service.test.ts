import {
  authenticateWithInformatica,
  _checkImportJobStatus,
  _importMappingDocumentation,
  _uploadMappingFile,
} from '@/lib/services/informatica-mapping-service'

import {
  mockAuthResponse,
  _mockFailedAuthResponse,
  _mockFailedJobResponse,
  _mockFailedJobStatusResponse,
  _mockJobResponse,
  _mockJobStatusResponse,
  _mockRunningJobStatusResponse,
} from '../../mocks/handlers'

// Mock fetch globally
const mockFetch = global.fetch as jest.Mock

// Helper to create proper Response objects for mocking
const createMockResponse = (
  ok: boolean,
  data: any,
  status = 200,
  statusText = 'OK'
) => {
  return {
    ok,
    _status,
    _statusText,
    json: jest.fn().mockResolvedValue(_data),
    text: jest.fn().mockResolvedValue(JSON.stringify(_data)),
  }
}

describe('Informatica Mapping Service', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('authenticateWithInformatica', () => {
    it('should authenticate successfully', async () => {
      // Mock successful login response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_true, {
          sessionId: 'mock-session-id',
          orgId: 'mock-org-id',
        })
      )

      // Mock successful token response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_true, { token: 'mock-token' })
      )

      const result = await authenticateWithInformatica({
        username: 'testuser',
        password: 'testpass',
        baseUrl: 'https://test-base-url.com',
        apiUrl: 'https://test-api-url.com/api',
      })

      expect(_mockFetch).toHaveBeenCalledTimes(2)
      expect(_mockFetch).toHaveBeenNthCalledWith(
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
      )

      expect(_result).toEqual({
        session: {
          sessionId: 'mock-session-id',
          orgId: 'mock-org-id',
          apiUrl: 'https://test-api-url.com/api',
        },
        token: {
          token: 'mock-token',
          expiresAt: expect.any(_Number),
        },
      })
    })

    it('should handle authentication failure', async () => {
      // Mock failed authentication response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          false,
          { error: 'Invalid credentials' },
          401,
          'Unauthorized'
        )
      )

      await expect(
        authenticateWithInformatica({
          username: 'wronguser',
          password: 'wrongpass',
          baseUrl: 'https://test-base-url.com',
          apiUrl: 'https://test-api-url.com/api',
        })
      ).rejects.toThrow('Login failed: {"error":"Invalid credentials"}')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        authenticateWithInformatica({
          username: 'testuser',
          password: 'testpass',
          baseUrl: 'https://test-base-url.com',
          apiUrl: 'https://test-api-url.com/api',
        })
      ).rejects.toThrow('Network error')
    })
  })

  describe('importMappingDocumentation', () => {
    const mockSessionInfo = {
      sessionId: 'mock-session-id',
      orgId: 'mock-org-id',
      apiUrl: 'https://test-api-url.com',
    }

    const mockAuthToken = {
      token: 'mock-token',
      expiresAt: Date.now() + 3600000,
    }

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
    ]

    it('should import mapping documentation successfully', async () => {
      // Mock successful import response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_true, { jobId: 'mock-job-id' })
      )

      const result = await importMappingDocumentation(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        _mockMappingData
      )

      expect(_mockFetch).toHaveBeenCalledTimes(1)
      expect(_result).toEqual({
        success: true,
        jobId: 'mock-job-id',
      })
    })

    it('should handle import failure', async () => {
      // Mock failed import response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          false,
          { error: 'Invalid data format' },
          400,
          'Bad Request'
        )
      )

      const result = await importMappingDocumentation(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        _mockMappingData
      )

      expect(_result).toEqual({
        success: false,
        error:
          'Failed to import mapping documentation: {"error":"Invalid data format"}',
      })
    })
  })

  describe('uploadMappingFile', () => {
    const mockSessionInfo = {
      sessionId: 'mock-session-id',
      orgId: 'mock-org-id',
      apiUrl: 'https://test-api-url.com',
    }

    const mockAuthToken = {
      token: 'mock-token',
      expiresAt: Date.now() + 3600000,
    }

    const mockFile = new File(['test file content'], 'test-mapping.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    it('should upload mapping file successfully', async () => {
      // Mock successful upload response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_true, { jobId: 'mock-job-id' })
      )

      const result = await uploadMappingFile(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        _mockFile
      )

      expect(_mockFetch).toHaveBeenCalledTimes(1)
      expect(_result).toEqual({
        success: true,
        jobId: 'mock-job-id',
      })
    })

    it('should handle upload failure', async () => {
      // Mock failed upload response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(
          false,
          { error: 'Invalid file format' },
          400,
          'Bad Request'
        )
      )

      const result = await uploadMappingFile(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        _mockFile
      )

      expect(_result).toEqual({
        success: false,
        error: 'Failed to upload mapping file: {"error":"Invalid file format"}',
      })
    })
  })

  describe('checkImportJobStatus', () => {
    const mockSessionInfo = {
      sessionId: 'mock-session-id',
      orgId: 'mock-org-id',
      apiUrl: 'https://test-api-url.com',
    }

    const mockAuthToken = {
      token: 'mock-token',
      expiresAt: Date.now() + 3600000,
    }

    it('should check job status successfully - COMPLETED', async () => {
      // Mock successful job status response
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_true, { status: 'COMPLETED' })
      )

      const result = await checkImportJobStatus(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        'test-job-id'
      )

      expect(_mockFetch).toHaveBeenCalledTimes(1)
      expect(_result).toEqual({
        status: 'COMPLETED',
        details: { status: 'COMPLETED' },
      })
    })

    it('should check job status successfully - RUNNING', async () => {
      // Mock running job status
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_true, { status: 'RUNNING' })
      )

      const result = await checkImportJobStatus(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        'test-job-id'
      )

      expect(_result).toEqual({
        status: 'RUNNING',
        details: { status: 'RUNNING' },
      })
    })

    it('should check job status successfully - FAILED', async () => {
      // Mock failed job status
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_true, {
          status: 'FAILED',
          error: 'Import job failed',
        })
      )

      const result = await checkImportJobStatus(
        {
          session: mockSessionInfo,
          token: mockAuthToken,
        },
        'test-job-id'
      )

      expect(_result).toEqual({
        status: 'FAILED',
        details: {
          error: 'Import job failed',
          status: 'FAILED',
        },
      })
    })

    it('should handle status check failure', async () => {
      // Mock failed job status check
      mockFetch.mockResolvedValueOnce(
        createMockResponse(_false, { error: 'Job not found' }, 404, 'Not Found')
      )

      await expect(
        checkImportJobStatus(
          {
            session: mockSessionInfo,
            token: mockAuthToken,
          },
          'nonexistent-job'
        )
      ).rejects.toThrow('Failed to check job status: {"error":"Job not found"}')
    })
  })
})
