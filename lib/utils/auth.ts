/**
 * Authentication utilities for Informatica Cloud OAuth 2.0
 */

// Types for authentication
export interface InformaticaAuthCredentials {
  username: string;
  password: string;
}

export interface InformaticaSession {
  sessionId: string;
  orgId: string;
}

export interface InformaticaToken {
  accessToken: string;
  expiresAt: number; // Timestamp when token expires
}

// Configuration for different Informatica Cloud regions
export const INFORMATICA_REGIONS = {
  US: 'https://dm-us.informaticacloud.com',
  EMEA: 'https://dm-em.informaticacloud.com',
  APJ: 'https://dm-ap.informaticacloud.com',
  CANADA: 'https://dm-na.informaticacloud.com',
  UK: 'https://dm-uk.informaticacloud.com',
};

export const API_REGIONS = {
  US: 'https://idmc-api.dm-us.informaticacloud.com/',
  EMEA: 'https://idmc-api.dm-em.informaticacloud.com/',
  APJ: 'https://idmc-api.dm-ap.informaticacloud.com/',
  CANADA: 'https://idmc-api.dm-na.informaticacloud.com/',
  UK: 'https://idmc-api.dm-uk.informaticacloud.com/',
};

// Default region
export const DEFAULT_REGION = 'US';

/**
 * Get the base URL for authentication based on the specified region
 */
export function getAuthBaseUrl(
  region: keyof typeof INFORMATICA_REGIONS = DEFAULT_REGION
): string {
  return INFORMATICA_REGIONS[region];
}

/**
 * Get the base API URL for Informatica Cloud based on the specified region
 */
export function getApiBaseUrl(
  region: keyof typeof API_REGIONS = DEFAULT_REGION
): string {
  return API_REGIONS[region];
}

/**
 * Get an Informatica Cloud session using username and password
 *
 * @param credentials The username and password for Informatica Cloud
 * @param region The Informatica Cloud region
 * @returns The session information
 */
export async function getInformaticaSession(
  credentials: InformaticaAuthCredentials,
  region: keyof typeof INFORMATICA_REGIONS = DEFAULT_REGION
): Promise<InformaticaSession> {
  const baseUrl = getAuthBaseUrl(region);
  const loginUrl = `${baseUrl}/identity-service/api/v1/Login`;

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(
      `Authentication failed: ${errorData.error || response.statusText}`
    );
  }

  const data = await response.json();

  return {
    sessionId: data.sessionId,
    orgId: data.orgId,
  };
}

/**
 * Generate a JWT token using the session ID obtained from login
 *
 * @param session The Informatica session information
 * @param region The Informatica Cloud region
 * @returns The access token and expiration time
 */
export async function generateJwtToken(
  session: InformaticaSession,
  region: keyof typeof INFORMATICA_REGIONS = DEFAULT_REGION
): Promise<InformaticaToken> {
  const baseUrl = getAuthBaseUrl(region);
  const tokenUrl = `${baseUrl}/identity-service/api/v1/jwt/Token?client_id=idmc_api&nonce=1234`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      cookie: `USER_SESSION=${session.sessionId}`,
      'IDS-SESSION-ID': session.sessionId,
    },
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(
      `Token generation failed: ${errorData.error || response.statusText}`
    );
  }

  const data = await response.json();

  // Token expires after 30 minutes (1800 seconds)
  const expiresAt = Date.now() + 1800 * 1000;

  return {
    accessToken: data.token,
    expiresAt,
  };
}

/**
 * Check if a token is expired or about to expire (within 5 minutes)
 *
 * @param token The token to check
 * @returns True if the token is expired or about to expire
 */
export function isTokenExpired(token: InformaticaToken): boolean {
  // Consider token expired if less than 5 minutes remaining
  const expirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() + expirationBuffer >= token.expiresAt;
}
