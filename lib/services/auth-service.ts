/**
 * Service for handling authentication with Informatica Cloud
 */

import {
  InformaticaAuthCredentials,
  InformaticaSession,
  InformaticaToken,
  INFORMATICA_REGIONS,
  getInformaticaSession,
  generateJwtToken,
  isTokenExpired
} from '../utils/auth'

// In-memory token cache (would be replaced with a proper session store in production)
let tokenCache: {
  session?: InformaticaSession
  token?: InformaticaToken
  region?: keyof typeof INFORMATICA_REGIONS
} = {}

/**
 * Authenticate with Informatica Cloud and get an access token
 * 
 * @param credentials The Informatica Cloud credentials
 * @param region The Informatica Cloud region
 * @param forceRefresh Whether to force a token refresh even if a valid token exists
 * @returns The authentication token
 */
export async function authenticate(
  credentials: InformaticaAuthCredentials,
  region: keyof typeof INFORMATICA_REGIONS = 'US',
  forceRefresh = false
): Promise<InformaticaToken> {
  // If we have a valid token and don't need to refresh, return it
  if (
    !forceRefresh &&
    tokenCache.token && 
    tokenCache.region === region && 
    !isTokenExpired(tokenCache.token)
  ) {
    return tokenCache.token
  }

  // Get a new session
  const session = await getInformaticaSession(credentials, region)
  
  // Generate a new token
  const token = await generateJwtToken(session, region)
  
  // Update cache
  tokenCache = {
    session,
    token,
    region
  }
  
  return token
}

/**
 * Get the current authentication information
 * 
 * @returns The current session and token information, or null if not authenticated
 */
export function getCurrentAuth(): {
  session: InformaticaSession
  token: InformaticaToken
  region: keyof typeof INFORMATICA_REGIONS
} | null {
  if (!tokenCache.session || !tokenCache.token || !tokenCache.region) {
    return null
  }
  
  return {
    session: tokenCache.session,
    token: tokenCache.token,
    region: tokenCache.region
  }
}

/**
 * Clear the current authentication information
 */
export function clearAuth(): void {
  tokenCache = {}
}

/**
 * Refresh the current authentication token if needed
 * 
 * @param credentials The Informatica Cloud credentials
 * @returns The refreshed token, or null if credentials are missing
 */
export async function refreshTokenIfNeeded(
  credentials: InformaticaAuthCredentials
): Promise<InformaticaToken | null> {
  const currentAuth = getCurrentAuth()
  
  if (!currentAuth) {
    if (!credentials) {
      return null
    }
    
    // No current auth, authenticate from scratch
    return authenticate(credentials)
  }
  
  // Check if token is expired or about to expire
  if (isTokenExpired(currentAuth.token)) {
    return authenticate(credentials, currentAuth.region, true)
  }
  
  return currentAuth.token
} 