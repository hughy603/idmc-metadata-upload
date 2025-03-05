import { useEffect, useState } from 'react';

import { useMockAuth } from '@/lib/providers/mock-auth-provider';
import {
  login as authLogin,
  authService,
  getAuthStatus,
} from '@/lib/services/auth-service';
import type { InformaticaAuthCredentials } from '@/lib/utils/auth';

// Define a function to check if we're in mock mode
const isMockMode = () => process.env.NEXT_PUBLIC_MOCK_API === 'true';

export interface AuthState {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  error: string | null;
  region: string;
  session?: any;
  token?: any;
}

export interface UseInformaticaAuthReturn {
  authState: AuthState;
  authenticate: (credentials: InformaticaAuthCredentials) => Promise<boolean>;
  logout: () => void;
  reset: () => void;
}

/**
 * Custom hook for handling Informatica authentication
 */
export function useInformaticaAuth(): UseInformaticaAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticating: false,
    isAuthenticated: false,
    error: null,
    region: 'US',
  });
  const { isMockAuthEnabled, getMockCredentials } = useMockAuth();

  // Initialize auth state based on stored authentication
  useEffect(() => {
    const status = getAuthStatus();
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: status.isAuthenticated,
      region: status.region,
    }));
  }, []);

  // Check if mock auth is enabled on component mount
  useEffect(() => {
    if (isMockMode() && isMockAuthEnabled && getMockCredentials()) {
      const mockCredentials = getMockCredentials();
      if (mockCredentials) {
        // Create a mock session and token for mock auth
        const mockSession = {
          sessionId: 'mock-session-' + Math.random().toString(36).substring(2),
          orgId: 'mock-org-' + Math.random().toString(36).substring(2),
        };

        const mockToken = {
          token: 'mock-token-' + Math.random().toString(36).substring(2),
          expiresAt: Date.now() + 3600000, // 1 hour expiry
        };

        // Store mock session and token
        localStorage.setItem('informaticaSession', JSON.stringify(mockSession));
        localStorage.setItem('informaticaToken', JSON.stringify(mockToken));

        setAuthState({
          isAuthenticating: false,
          isAuthenticated: true,
          error: null,
          region: 'US',
          session: mockSession,
          token: mockToken,
        });
      }
    }
  }, [isMockAuthEnabled, getMockCredentials]);

  /**
   * Authenticate with Informatica Cloud
   */
  const authenticate = async (
    credentials: InformaticaAuthCredentials
  ): Promise<boolean> => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticating: true,
      error: null,
    }));

    try {
      const success = await authLogin(credentials);

      if (success) {
        const status = getAuthStatus();
        setAuthState({
          isAuthenticating: false,
          isAuthenticated: true,
          error: null,
          region: status.region,
        });
      } else {
        setAuthState({
          isAuthenticating: false,
          isAuthenticated: false,
          error: 'Authentication failed',
          region: 'US',
        });
      }

      return success;
    } catch (error) {
      setAuthState({
        isAuthenticating: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        region: 'US',
      });

      return false;
    }
  };

  /**
   * Log out from Informatica Cloud
   */
  const logout = (): void => {
    authService.logout();
    setAuthState({
      isAuthenticating: false,
      isAuthenticated: false,
      error: null,
      region: 'US',
    });
  };

  /**
   * Reset the authentication state
   */
  const reset = (): void => {
    logout();
  };

  return {
    authState,
    authenticate,
    logout,
    reset,
  };
}
