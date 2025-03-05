import type { InformaticaAuthCredentials } from '@/lib/utils/auth';
/**
 * Client-side service for managing authentication tokens
 */

// Token storage keys
const TOKEN_KEY = 'informatica_token';
const TOKEN_EXPIRY_KEY = 'informatica_token_expiry';
const REGION_KEY = 'informatica_region';

// Credentials storage in memory only, never persisted
let credentials: InformaticaAuthCredentials | null = null;

/**
 * Get the stored token if available and not expired
 *
 * @returns The token if available and valid, otherwise null
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiryStr) {
    return null;
  }

  const expiry = Number(expiryStr);

  // Check if token is expired or will expire in the next 5 minutes
  if (Date.now() + 5 * 60 * 1000 >= expiry) {
    // Clear the expired token
    clearStoredToken();
    return null;
  }

  return token;
}

/**
 * Store the token and its expiration time
 *
 * @param token The token to store
 * @param expiresAt The expiration timestamp
 * @param region Optional region to store
 */
export function storeToken(
  token: string,
  expiresAt: number,
  region?: string
): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());

  if (region) {
    localStorage.setItem(REGION_KEY, region);
  }
}

/**
 * Clear the stored token
 */
export function clearStoredToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(REGION_KEY);
  credentials = null;
}

/**
 * Store credentials in memory (never persisted to storage)
 *
 * @param creds The credentials to store
 */
export function storeCredentials(creds: InformaticaAuthCredentials): void {
  credentials = creds;
}

/**
 * Get the stored credentials if available
 *
 * @returns The stored credentials or null
 */
export function getStoredCredentials(): InformaticaAuthCredentials | null {
  return credentials;
}

/**
 * Get the stored region if available
 *
 * @returns The stored region or null
 */
export function getStoredRegion(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(REGION_KEY);
}

/**
 * Check if the user is authenticated (has a valid token)
 *
 * @returns True if authenticated
 */
export function isAuthenticated(): boolean {
  return getStoredToken() !== null;
}

/**
 * Authenticate with Informatica Cloud
 *
 * @param credentials The credentials to use
 * @param region Optional region
 * @returns The authentication result
 */
export async function authenticate(
  credentials: InformaticaAuthCredentials,
  region?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // For demonstration purposes, we'll simulate a successful authentication
    // In a real app, you would make an API call to authenticate with Informatica

    // Store the region if provided
    if (region) {
      localStorage.setItem(REGION_KEY, region);
    }

    // Store the credentials for potential token refresh
    storeCredentials(credentials);

    // Generate a mock token that expires in 1 hour
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const token = 'mock-token-' + Math.random().toString(36).substring(2);

    // Store the token
    storeToken(token, expiresAt);

    return { success: true };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh the authentication token if needed
 *
 * @returns The refresh result
 */
export async function refreshTokenIfNeeded(): Promise<{
  success: boolean;
  error?: string;
}> {
  // Check if we have a token and if it's expired
  const token = getStoredToken();

  if (token) {
    // Token exists and is not expired (getStoredToken handles expiry check)
    return { success: true };
  }

  // Try to refresh the token using stored credentials
  const storedCredentials = getStoredCredentials();

  if (!storedCredentials) {
    return { success: false, error: 'No stored credentials found' };
  }

  // Attempt to authenticate with stored credentials
  return authenticate(storedCredentials);
}

/**
 * Logout and clear authentication
 */
export function logout(): void {
  clearStoredToken();
}
