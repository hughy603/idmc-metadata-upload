/**
 * Service for handling authentication with Informatica Cloud
 */

import { InformaticaAuthCredentials } from '@/lib/services/informatica-mapping-service'

// Define interfaces
export interface InformaticaSession {
  sessionId: string;
  orgId: string;
  expiresAt: string;
}

export interface InformaticaToken {
  accessToken: string;
  expiresAt: number;
}

// Define regions
export const INFORMATICA_REGIONS = {
  US: {
    baseUrl: 'https://dm-us.informaticacloud.com',
    apiUrl: 'https://idmc-api.dm-us.informaticacloud.com',
  },
  EMEA: {
    baseUrl: 'https://dm-em.informaticacloud.com',
    apiUrl: 'https://idmc-api.dm-em.informaticacloud.com',
  },
  APJ: {
    baseUrl: 'https://dm-ap.informaticacloud.com',
    apiUrl: 'https://idmc-api.dm-ap.informaticacloud.com',
  },
}

// In-memory token cache (would be replaced with a proper session store in production)
let tokenCache: {
  session?: InformaticaSession
  token?: InformaticaToken
  region?: keyof typeof INFORMATICA_REGIONS
} = {}

/**
 * Check if development mock mode is enabled
 * @returns True if mock mode is enabled
 */
export function isMockMode(): boolean {
  return process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' &&
    localStorage.getItem('mockAuthEnabled') === 'true'
}

/**
 * Create a mock token for development purposes
 * @returns A mock Informatica token
 */
function createMockToken(): InformaticaToken {
  return {
    accessToken: 'mock-access-token-for-development-only',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
  }
}

/**
 * Create a mock session for development purposes
 * @returns A mock Informatica session
 */
function createMockSession(): InformaticaSession {
  return {
    sessionId: 'mock-session-id-for-development-only',
    orgId: 'mock-org-id-for-development-only',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  }
}

/**
 * Check if a token is expired or about to expire (within 5 minutes)
 */
function isTokenExpired(token: InformaticaToken): boolean {
  // Consider token expired if it's within 5 minutes of expiration
  return Date.now() >= token.expiresAt - 5 * 60 * 1000;
}

/**
 * Get a session from Informatica Cloud
 */
async function getInformaticaSession(
  credentials: InformaticaAuthCredentials,
  region: keyof typeof INFORMATICA_REGIONS
): Promise<InformaticaSession> {
  // In a real implementation, this would make an API call to Informatica
  // For now, we'll just return a mock session
  return createMockSession();
}

/**
 * Generate a JWT token for Informatica Cloud API access
 */
async function generateJwtToken(
  session: InformaticaSession,
  region: keyof typeof INFORMATICA_REGIONS
): Promise<InformaticaToken> {
  // In a real implementation, this would generate a JWT token
  // For now, we'll just return a mock token
  return createMockToken();
}

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
  // If we're in mock mode, return a mock token
  if (isMockMode()) {
    console.log('Using mock authentication mode for development')

    // Return mock token and cache it
    const mockSession = createMockSession()
    const mockToken = createMockToken()

    tokenCache = {
      session: mockSession,
      token: mockToken,
      region
    }

    return mockToken
  }

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
    region,
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
    region: tokenCache.region,
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
