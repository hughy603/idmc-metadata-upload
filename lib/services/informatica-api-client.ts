import { getApiBaseUrl } from '@/lib/utils/auth';

import { apiRateLimiter } from './api-rate-limiter';
import { authService } from './auth-service';
/**
 * A simplified API client for Informatica Cloud API
 */

// Informatica API response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// API request options
interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

/**
 * Makes an API request to the Informatica Cloud API
 *
 * @param endpoint The API endpoint to call (without base URL)
 * @param options Request options
 * @returns A typed API response
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  // Use the rate limiter to manage API call frequency
  return apiRateLimiter.enqueue(async () => {
    try {
      const {
        method = 'GET',
        body,
        headers = {},
        requiresAuth = true,
      } = options;

      // Get the base URL for the current region
      const authStatus = authService.getAuthStatus();
      const baseUrl = getApiBaseUrl(authStatus.region as any);

      // Prepare URL
      const url = new URL(endpoint, baseUrl).toString();

      // Prepare headers with authentication token if required
      const requestHeaders: Record<string, string> = {
        ...headers,
        'Content-Type': headers['Content-Type'] || 'application/json',
        Accept: 'application/json',
      };

      // Add authentication if required
      if (requiresAuth) {
        const token = await authService.getAccessToken();
        if (!token) {
          return {
            success: false,
            error: 'Not authenticated',
            statusCode: 401,
          };
        }

        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include',
      };

      // Add body if provided
      if (body) {
        if (body instanceof FormData) {
          // If FormData, remove Content-Type header to let browser set it with boundary
          delete requestHeaders['Content-Type'];
          requestOptions.body = body;
        } else {
          requestOptions.body = JSON.stringify(body);
        }
      }

      // Make the request
      const response = await fetch(url, requestOptions);

      // Parse response based on content type
      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text();
      } else {
        // For binary responses or other types
        data = await response.blob();
      }

      // Return success or error based on status code
      if (response.ok) {
        return {
          success: true,
          data,
          statusCode: response.status,
        };
      } else {
        return {
          success: false,
          error: data.error || response.statusText,
          statusCode: response.status,
          data,
        };
      }
    } catch (error) {
      // Handle network or other errors
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown API error';
      return {
        success: false,
        error: errorMessage,
        statusCode: 0,
      };
    }
  });
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method'>
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method'>
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method'>
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(
    endpoint: string,
    options?: Omit<ApiRequestOptions, 'method'>
  ): Promise<ApiResponse<T>> =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
