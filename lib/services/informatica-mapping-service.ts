/**
 * Service for submitting mapping documentation to Informatica Cloud's Data Catalog API
 */

// Types for authentication and requests
export interface InformaticaAuthCredentials {
  username: string
  password: string
  baseUrl: string // e.g. 'https://dm-us.informaticacloud.com'
  apiUrl: string // e.g. 'https://idmc-api.dm-us.informaticacloud.com'
}

export interface SessionInfo {
  sessionId: string
  orgId: string
  apiUrl: string // Base API URL for API requests
}

export interface AuthTokenInfo {
  token: string
  expiresAt: number // timestamp when token expires
}

export interface MappingDocumentationData {
  sourceSystem: string
  sourceTable: string
  sourceColumn: string
  targetSystem: string
  targetTable: string
  targetColumn: string
  transformationLogic?: string
  businessTerm?: string
  description?: string
}

export interface MappingImportResult {
  success: boolean
  jobId?: string
  error?: string
}

/**
 * Authenticates with Informatica Cloud and returns session and token information
 * 
 * @param credentials Authentication credentials
 * @returns Session information and auth token
 */
export async function authenticateWithInformatica(
  credentials: InformaticaAuthCredentials
): Promise<{ session: SessionInfo; token: AuthTokenInfo }> {
  try {
    // Step 1: Get session ID
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
    )

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text()
      throw new Error(`Login failed: ${errorText}`)
    }

    const loginData = await loginResponse.json()
    const sessionId = loginData.sessionId
    const orgId = loginData.orgId

    // Step 2: Get JWT token
    const tokenResponse = await fetch(
      `${credentials.baseUrl}/identity-service/api/v1/jwt/Token?client_id=idmc_api&nonce=1234`,
      {
        method: 'POST',
        headers: {
          'cookie': `USER_SESSION=${sessionId}`,
          'IDS-SESSION-ID': sessionId
        },
      }
    )

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Token generation failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    const token = tokenData.token

    // Calculate token expiry (30 minutes from now)
    const expiresAt = Date.now() + 29 * 60 * 1000 // 29 minutes in milliseconds

    return {
      session: { sessionId, orgId, apiUrl: credentials.apiUrl },
      token: { token, expiresAt }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    throw error
  }
}

/**
 * Imports mapping documentation to Informatica Cloud Data Catalog
 * 
 * @param auth Authentication information
 * @param mappingData Array of mapping documentation data
 * @returns Result of the import operation
 */
export async function importMappingDocumentation(
  auth: { session: SessionInfo; token: AuthTokenInfo },
  mappingData: MappingDocumentationData[]
): Promise<MappingImportResult> {
  try {
    // Check if token is expired
    if (Date.now() >= auth.token.expiresAt) {
      throw new Error('Authentication token has expired')
    }

    // Prepare the request body
    // Convert the mapping data to the format expected by Informatica
    const assets = mappingData.map(mapping => {
      return {
        // Asset metadata
        "core.name": `${mapping.sourceColumn} to ${mapping.targetColumn}`,
        "core.description": mapping.description || `Mapping from ${mapping.sourceSystem}.${mapping.sourceTable}.${mapping.sourceColumn} to ${mapping.targetSystem}.${mapping.targetTable}.${mapping.targetColumn}`,
        "core.classType": "com.infa.ldm.mapping.MappingSpecification",
        
        // Source and target information
        "mapping.sourceAttribute": {
          "core.name": mapping.sourceColumn,
          "core.classType": "com.infa.ldm.relational.Column",
          "core.resourceName": mapping.sourceSystem,
          "core.resourceType": "JDBC",
          "core.containerName": mapping.sourceTable
        },
        "mapping.targetAttribute": {
          "core.name": mapping.targetColumn,
          "core.classType": "com.infa.ldm.relational.Column",
          "core.resourceName": mapping.targetSystem,
          "core.resourceType": "JDBC",
          "core.containerName": mapping.targetTable
        },
        
        // Add transformation logic if provided
        ...(mapping.transformationLogic ? {
          "mapping.transformationLogic": mapping.transformationLogic
        } : {}),
        
        // Add business term reference if provided
        ...(mapping.businessTerm ? {
          "mapping.businessTerm": mapping.businessTerm
        } : {})
      }
    })

    // Make the API request to import the mapping documentation
    const response = await fetch(
      `${auth.session.apiUrl}/data360/import/v1/assets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token.token}`,
          'X-INFA-ORG-ID': auth.session.orgId
        },
        body: JSON.stringify({ assets })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to import mapping documentation: ${errorText}`)
    }

    const result = await response.json()
    return {
      success: true,
      jobId: result.jobId || 'unknown'
    }
  } catch (error) {
    console.error('Error importing mapping documentation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Checks the status of an import job
 * 
 * @param auth Authentication information
 * @param jobId ID of the import job
 * @returns Status of the job
 */
export async function checkImportJobStatus(
  auth: { session: SessionInfo; token: AuthTokenInfo },
  jobId: string
): Promise<{ status: string; details?: any }> {
  try {
    // Check if token is expired
    if (Date.now() >= auth.token.expiresAt) {
      throw new Error('Authentication token has expired')
    }

    const response = await fetch(
      `${auth.session.apiUrl}/data360/jobmanager/v1/jobs/${jobId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.token.token}`,
          'X-INFA-ORG-ID': auth.session.orgId
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to check job status: ${errorText}`)
    }

    const result = await response.json()
    return {
      status: result.status,
      details: result
    }
  } catch (error) {
    console.error('Error checking job status:', error)
    throw error
  }
}

/**
 * Uploads an Excel or CSV file containing mapping documentation
 * 
 * @param auth Authentication information
 * @param file The file to upload
 * @param description Optional description for the uploaded mappings
 * @returns Result of the file upload operation
 */
export async function uploadMappingFile(
  auth: { session: SessionInfo; token: AuthTokenInfo },
  file: File,
  description?: string
): Promise<MappingImportResult> {
  try {
    // Check if token is expired
    if (Date.now() >= auth.token.expiresAt) {
      throw new Error('Authentication token has expired')
    }

    // Create a FormData object to send the file
    const formData = new FormData()
    formData.append('file', file)
    
    if (description) {
      formData.append('description', description)
    }

    // Set the import type for mapping documentation
    formData.append('importType', 'MAPPING')

    // Make the API request to upload the file
    const response = await fetch(
      `${auth.session.apiUrl}/data360/import/v1/file`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token.token}`,
          'X-INFA-ORG-ID': auth.session.orgId
        },
        body: formData
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload mapping file: ${errorText}`)
    }

    const result = await response.json()
    return {
      success: true,
      jobId: result.jobId || 'unknown'
    }
  } catch (error) {
    console.error('Error uploading mapping file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 