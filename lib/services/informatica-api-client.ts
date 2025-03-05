/**
 * API client for making authenticated requests to Informatica Cloud
 */

import { getApiBaseUrl } from '@/lib/utils/auth'
import { InformaticaAuthCredentials } from '@/lib/services/informatica-mapping-service'

import { getCurrentAuth, authenticate } from './auth-service'

// Types for API requests
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  credentials?: InformaticaAuthCredentials
}

/**
 * Makes an authenticated request to the Informatica Cloud API
 *
 * @param endpoint The API endpoint to call (without the base URL)
 * @param options Request options
 * @returns The API response
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const auth = getCurrentAuth()
  const credentials = options.credentials

  // Check if we have valid auth or credentials to authenticate
  if (!auth && !credentials) {
    throw new Error('No authentication available. Please provide credentials.')
  }

  // Get token from current auth or authenticate with provided credentials
  const token =
    auth?.token ||
    (credentials ? (await authenticate(credentials)).accessToken : null)

  if (!token) {
    throw new Error('Failed to get authentication token')
  }

  // Get the base API URL
  const baseUrl = getApiBaseUrl(auth?.region || 'US')

  // Prepare request headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${typeof token === 'string' ? token : token.accessToken}`,
    ...options.headers,
  }

  // Add the org ID if available
  if (auth?.session?.orgId) {
    headers['X-INFA-ORG-ID'] = auth.session.orgId
  }

  // Add the session ID if available (required for some endpoints)
  if (auth?.session?.sessionId) {
    headers['IDS-SESSION-ID'] = auth.session.sessionId
  }

  // Prepare request options
  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  }

  // Make the request
  const response = await fetch(`${baseUrl}${endpoint}`, requestOptions)

  // Handle error responses
  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`

    try {
      const errorData = await response.json()
      errorMessage = `API request failed: ${errorData.error || errorMessage}`
    } catch (_e) {
      // If we can't parse the error response, just use the status message
    }

    throw new Error(errorMessage)
  }

  // Parse and return response
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    return response.json()
  }

  return response.text() as unknown as T
}
