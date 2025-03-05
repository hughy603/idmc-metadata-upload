import { Buffer } from 'buffer';

import type {
  InformaticaAuthCredentials,
  InformaticaSession,
  InformaticaToken,
} from '@/lib/utils/auth';
import {
  generateJwtToken,
  getAuthBaseUrl,
  getInformaticaSession,
  INFORMATICA_REGIONS,
  isTokenExpired,
} from '@/lib/utils/auth';

// Polyfill for btoa
const btoa =
  typeof window !== 'undefined'
    ? window.btoa
    : (str: string) => Buffer.from(str).toString('base64');

/**
 * Service for handling authentication with Informatica Cloud
 */

// Token storage keys
const TOKEN_STORAGE_KEY = 'informatica_token';
const SESSION_STORAGE_KEY = 'informatica_session';
const REGION_STORAGE_KEY = 'informatica_region';

/**
 * Unified authentication service for Informatica Cloud
 * Handles both username/password and OAuth authentication methods
 */
export class AuthService {
  // Singleton instance
  private static instance: AuthService;

  // Authentication state
  private token: InformaticaToken | null = null;
  private session: InformaticaSession | null = null;
  private region: keyof typeof INFORMATICA_REGIONS = 'US';
  private isAuthenticated = false;

  private constructor() {
    // Initialize from storage if available
    this.loadFromStorage();
  }

  /**
   * Get the singleton instance of the authentication service
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load authentication data from storage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Load token
      const tokenJson = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (tokenJson) {
        this.token = JSON.parse(tokenJson);

        // Check if token is expired
        if (this.token && !isTokenExpired(this.token)) {
          this.isAuthenticated = true;
        } else {
          this.token = null;
          this.isAuthenticated = false;
        }
      }

      // Load session
      const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionJson) {
        this.session = JSON.parse(sessionJson);
      }

      // Load region
      const region = localStorage.getItem(REGION_STORAGE_KEY);
      if (region && Object.keys(INFORMATICA_REGIONS).includes(region)) {
        this.region = region as keyof typeof INFORMATICA_REGIONS;
      }
    } catch (error) {
      console.error('Error loading auth data from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * Save authentication data to storage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    if (this.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(this.token));
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    if (this.session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    localStorage.setItem(REGION_STORAGE_KEY, this.region);
  }

  /**
   * Clear all authentication data
   */
  public clearAuth(): void {
    this.token = null;
    this.session = null;
    this.isAuthenticated = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  /**
   * Set the region for API calls
   */
  public setRegion(region: keyof typeof INFORMATICA_REGIONS): void {
    this.region = region;
    this.saveToStorage();
  }

  /**
   * Get the current authentication status
   */
  public getAuthStatus(): { isAuthenticated: boolean; region: string } {
    return {
      isAuthenticated: this.isAuthenticated,
      region: this.region,
    };
  }

  /**
   * Get the access token for API calls
   * Handles refreshing if necessary
   */
  public async getAccessToken(): Promise<string | null> {
    // If we have a valid token, return it
    if (this.token && !isTokenExpired(this.token)) {
      return this.token.accessToken;
    }

    // If we have a session but no token (or expired token), generate a new token
    if (this.session) {
      try {
        this.token = await generateJwtToken(this.session, this.region);
        this.isAuthenticated = true;
        this.saveToStorage();
        return this.token.accessToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        this.clearAuth();
        return null;
      }
    }

    return null;
  }

  /**
   * Authenticate with username and password
   */
  public async login(
    credentials: InformaticaAuthCredentials
  ): Promise<boolean> {
    try {
      // Get session from credentials
      this.session = await getInformaticaSession(credentials, this.region);

      // Generate token from session
      this.token = await generateJwtToken(this.session, this.region);

      this.isAuthenticated = true;
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Authenticate with OAuth
   * This initiates the OAuth flow
   */
  public initiateOAuth(redirectUri: string): string {
    const baseUrl = getAuthBaseUrl(this.region);
    const authUrl = `${baseUrl}/identity-service/oauth2/auth`;

    // In a real implementation, this would be configured in the app
    const clientId =
      process.env.NEXT_PUBLIC_INFORMATICA_CLIENT_ID || 'default-client-id';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'all',
    });

    return `${authUrl}?${params.toString()}`;
  }

  /**
   * Complete OAuth authentication with the authorization code
   */
  public async completeOAuth(
    code: string,
    redirectUri: string
  ): Promise<boolean> {
    try {
      const baseUrl = getAuthBaseUrl(this.region);
      const tokenUrl = `${baseUrl}/identity-service/oauth2/token`;

      // In a real implementation, these would be configured in the app
      const clientId =
        process.env.NEXT_PUBLIC_INFORMATICA_CLIENT_ID || 'default-client-id';
      const clientSecret =
        process.env.INFORMATICA_CLIENT_SECRET || 'default-client-secret';

      const basicAuth = btoa(`${clientId}:${clientSecret}`);
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`OAuth error: ${response.statusText}`);
      }

      const data = await response.json();

      // Store the token
      this.token = {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      this.isAuthenticated = true;
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('OAuth completion error:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * Log out and clear authentication
   */
  public logout(): void {
    this.clearAuth();
  }
}

// Export a singleton instance
export const authService = AuthService.getInstance();

// Export functions for easier access
export const login = (
  credentials: InformaticaAuthCredentials
): Promise<boolean> => authService.login(credentials);
export const logout = (): void => authService.logout();
export const getAccessToken = (): Promise<string | null> =>
  authService.getAccessToken();
export const getAuthStatus = (): { isAuthenticated: boolean; region: string } =>
  authService.getAuthStatus();
export const setRegion = (region: keyof typeof INFORMATICA_REGIONS): void =>
  authService.setRegion(region);
