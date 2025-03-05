import type { FileDataRow } from '@/app/components/file-data-table';
import { parseMappingFile } from '@/lib/utils/mapping-file-parser';

import { api } from './informatica-api-client';
/**
 * Service for handling metadata mapping uploads to Informatica Cloud
 */

/**
 * Authentication session information
 */
export interface InformaticaSession {
  sessionId: string;
  orgId: string;
  apiUrl: string;
}

/**
 * Authentication token information
 */
export interface AuthToken {
  token: string;
  expiresAt: number;
}

/**
 * Authentication result
 */
export interface AuthResult {
  session: InformaticaSession;
  token: AuthToken;
}

/**
 * Represents a single mapping data row
 */
export interface MappingDocumentationData {
  sourceSystem: string;
  sourceTable: string;
  sourceColumn: string;
  targetSystem: string;
  targetTable: string;
  targetColumn: string;
  transformationLogic?: string | undefined;
  businessTerm?: string | undefined;
  description?: string | undefined;
}

/**
 * Metadata catalog information
 */
export interface MetadataCatalog {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  status: 'ACTIVE' | 'PROCESSING' | 'ERROR';
}

/**
 * Response from mapping validation
 */
export interface ValidationResponse {
  isValid: boolean;
  mappingData?: MappingDocumentationData[];
  errors?: string[];
}

/**
 * Upload response
 */
export interface UploadResponse {
  success: boolean;
  catalogId?: string;
  error?: string;
}

/**
 * Job status response
 */
export interface JobStatus {
  id: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'QUEUED';
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

/**
 * Authenticate with Informatica Cloud
 */
export async function authenticateWithInformatica(credentials: {
  username: string;
  password: string;
  baseUrl: string;
  apiUrl: string;
}): Promise<AuthResult> {
  try {
    // Make login request to get session
    const loginResponse = await fetch(
      `${credentials.baseUrl}/identity-service/api/v1/Login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      }
    );

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${errorText}`);
    }

    const sessionData = await loginResponse.json();

    // Get auth token
    const tokenResponse = await fetch(
      `${credentials.baseUrl}/identity-service/api/v1/Token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token retrieval failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    return {
      session: {
        sessionId: sessionData.sessionId,
        orgId: sessionData.orgId,
        apiUrl: credentials.apiUrl,
      },
      token: {
        token: tokenData.token,
        expiresAt: Date.now() + 3600000, // 1 hour expiry
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Authentication failed');
  }
}

/**
 * Import mapping documentation
 */
export async function importMappingDocumentation(
  auth: AuthResult,
  mappingData: MappingDocumentationData[]
): Promise<{
  success: boolean;
  jobId?: string | undefined;
  error?: string | undefined;
}> {
  try {
    const response = await fetch(`${auth.session.apiUrl}/mappings/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token.token}`,
        'IDS-SESSION-ID': auth.session.sessionId,
      },
      body: JSON.stringify({ mappings: mappingData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to import mapping documentation: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.jobId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to import mapping documentation: ${errorMessage}`,
    };
  }
}

/**
 * Upload mapping file
 */
export async function uploadMappingFile(
  auth: AuthResult,
  file: File
): Promise<{
  success: boolean;
  jobId?: string | undefined;
  error?: string | undefined;
}> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${auth.session.apiUrl}/mappings/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.token.token}`,
        'IDS-SESSION-ID': auth.session.sessionId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Failed to upload mapping file: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      jobId: data.jobId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to upload mapping file: ${errorMessage}`,
    };
  }
}

/**
 * Check import job status
 */
export async function checkImportJobStatus(
  auth: AuthResult,
  jobId: string
): Promise<{
  success: boolean;
  status: string;
  isComplete: boolean;
  error?: string | undefined;
}> {
  try {
    const response = await fetch(`${auth.session.apiUrl}/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${auth.token.token}`,
        'IDS-SESSION-ID': auth.session.sessionId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to check job status: ${errorText}`);
    }

    const data = await response.json();
    const isComplete = data.status === 'COMPLETED' || data.status === 'FAILED';

    return {
      success: true,
      status: data.status,
      isComplete,
      ...(data.error && { error: data.error }),
    };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Failed to check job status');
  }
}

/**
 * Mapping service for handling Informatica metadata mapping operations
 */
export class MappingService {
  /**
   * Validates a mapping file
   */
  async validateFile(file: File): Promise<ValidationResponse> {
    try {
      // Validate file extension
      const allowedExtensions = ['.xlsx', '.csv', '.json'];
      const fileExtension = file.name
        .substring(file.name.lastIndexOf('.'))
        .toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        return {
          isValid: false,
          errors: [
            `Invalid file format. Please upload one of the following: ${allowedExtensions.join(', ')}`,
          ],
        };
      }

      // Parse the file contents
      const mappingData = await parseMappingFile(file);

      // Check if we got valid data
      if (!mappingData || mappingData.length === 0) {
        return {
          isValid: false,
          errors: ['No valid mapping data found in file'],
        };
      }

      return {
        isValid: true,
        mappingData,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during validation';
      return {
        isValid: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Uploads a mapping file to create a new catalog
   */
  async uploadFile(
    file: File,
    catalogName: string,
    description?: string
  ): Promise<UploadResponse> {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('catalogName', catalogName);

      if (description) {
        formData.append('description', description);
      }

      // Make API request to upload the file
      const response = await api.post<{ id: string }>('/catalogs', formData, {
        headers: {
          // Let the browser set the content type with boundary
        },
      });

      if (response.success && response.data) {
        return {
          success: true,
          catalogId: response.data.id,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to upload file',
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during upload';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload a single mapping row to an existing catalog
   */
  async uploadMappingRow(
    row: FileDataRow,
    catalogId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract mapping data from the row.data object
      const mapping: MappingDocumentationData = {
        sourceSystem: String(row.data.sourceSystem || ''),
        sourceTable: String(row.data.sourceTable || ''),
        sourceColumn: String(row.data.sourceColumn || ''),
        targetSystem: String(row.data.targetSystem || ''),
        targetTable: String(row.data.targetTable || ''),
        targetColumn: String(row.data.targetColumn || ''),
        transformationLogic: row.data.transformationLogic
          ? String(row.data.transformationLogic)
          : undefined,
        businessTerm: row.data.businessTerm
          ? String(row.data.businessTerm)
          : undefined,
        description: row.data.description
          ? String(row.data.description)
          : undefined,
      };

      // Validate required fields
      const missingFields = [];
      if (!mapping.sourceSystem) missingFields.push('Source System');
      if (!mapping.sourceTable) missingFields.push('Source Table');
      if (!mapping.sourceColumn) missingFields.push('Source Column');
      if (!mapping.targetSystem) missingFields.push('Target System');
      if (!mapping.targetTable) missingFields.push('Target Table');
      if (!mapping.targetColumn) missingFields.push('Target Column');

      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        };
      }

      // Prepare the payload for the API
      const payload = {
        catalogId,
        mapping,
      };

      // Make the API request
      const response = await api.post(
        `/catalogs/${catalogId}/mappings`,
        payload
      );

      return {
        success: response.success,
        ...(response.error ? { error: response.error } : {})
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error uploading mapping';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get the status of a processing job
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await api.get<JobStatus>(`/jobs/${jobId}`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get job status');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error getting job status';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get information about a metadata catalog
   */
  async getCatalog(catalogId: string): Promise<MetadataCatalog> {
    try {
      const response = await api.get<MetadataCatalog>(`/catalogs/${catalogId}`);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get catalog information');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error getting catalog';
      throw new Error(errorMessage);
    }
  }

  /**
   * Process a catalog (starts the mapping job)
   */
  async processCatalog(catalogId: string): Promise<{ jobId: string }> {
    try {
      const response = await api.post<{ jobId: string }>(
        `/catalogs/${catalogId}/process`
      );

      if (response.success && response.data) {
        return {
          jobId: response.data.jobId,
        };
      } else {
        throw new Error(response.error || 'Failed to process catalog');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error processing catalog';
      throw new Error(errorMessage);
    }
  }
}

// Export a singleton instance
export const mappingService = new MappingService();
