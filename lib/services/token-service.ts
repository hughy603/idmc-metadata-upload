/**
 * Client-side service for managing authentication tokens
 */

import { InformaticaAuthCredentials } from '../utils/auth'

// Token storage keys
const TOKEN_KEY = 'informatica_token'
const TOKEN_EXPIRY_KEY = 'informatica_token_expiry'
const REGION_KEY = 'informatica_region'

// Credentials storage in memory only, never persisted
let credentials: InformaticaAuthCredentials | null = null

/**
 * Get the stored token if available and not expired
 * 
 * @returns The token if available and valid, otherwise null
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  const token = localStorage.getItem(TOKEN_KEY)
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
  
  if (!token || !expiryStr) {
    return null
  }
  
  const expiry = Number(expiryStr)
  
  // Check if token is expired or will expire in the next 5 minutes
  if (Date.now() + 5 * 60 * 1000 >= expiry) {
    // Clear the expired token
    clearStoredToken()
    return null
  }
  
  return token
}

/**
 * Store the token and its expiration time
 * 
 * @param token The token to store
 * @param expiresAt The expiration timestamp
 * @param region Optional region to store
 */
export function storeToken(token: string, expiresAt: number, region?: string): void {
  if (typeof window === 'undefined') {
    return
  }
  
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString())
  
  if (region) {
    localStorage.setItem(REGION_KEY, region)
  }
}

/**
 * Clear the stored token
 */
export function clearStoredToken(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
  localStorage.removeItem(REGION_KEY)
  credentials = null
}

/**
 * Store credentials in memory (never persisted to storage)
 * 
 * @param creds The credentials to store
 */
export function storeCredentials(creds: InformaticaAuthCredentials): void {
  credentials = creds
}

/**
 * Get the stored credentials if available
 * 
 * @returns The stored credentials or null
 */
export function getStoredCredentials(): InformaticaAuthCredentials | null {
  return credentials
}

/**
 * Get the stored region if available
 * 
 * @returns The stored region or null
 */
export function getStoredRegion(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  return localStorage.getItem(REGION_KEY)
}

/**
 * Check if the user is authenticated (has a valid token)
 * 
 * @returns True if authenticated
 */
export function isAuthenticated(): boolean {
  return getStoredToken() !== null
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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        region,
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Authentication failed',
      }
    }
    
    // Store the token
    storeToken(data.accessToken, data.expiresAt, region)
    
    // Store credentials in memory for refresh (not persisted)
    storeCredentials(credentials)
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }
  }
}

/**
 * Refresh the authentication token if needed
 * 
 * @returns The refresh result
 */
export async function refreshTokenIfNeeded(): Promise<{ success: boolean; error?: string }> {
  // Check if token needs refresh
  const token = getStoredToken()
  
  if (token) {
    // Token is still valid
    return { success: true }
  }
  
  // Token needs refresh, check if we have credentials
  const storedCredentials = getStoredCredentials()
  
  if (!storedCredentials) {
    return {
      success: false,
      error: 'No credentials available for token refresh',
    }
  }
  
  // Get the region if stored
  const region = getStoredRegion()
  
  // Refresh the token
  return authenticate(storedCredentials, region || undefined)
}

/**
 * Logout and clear authentication
 */
export function logout(): void {
  clearStoredToken()
} 