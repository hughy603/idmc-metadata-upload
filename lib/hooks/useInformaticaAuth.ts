import { useState, useEffect } from 'react';

import {
  AuthTokenInfo,
  SessionInfo,
  InformaticaAuthCredentials,
  authenticateWithInformatica
} from '@/lib/services/informatica-mapping-service';
import { isMockMode } from '@/lib/services/auth-service';
import { useMockAuth } from '@/lib/providers/mock-auth-provider';

export interface AuthState {
  isAuthenticating: boolean;
  error: string | null;
  session: SessionInfo | null;
  token: AuthTokenInfo | null;
}

export interface UseInformaticaAuthReturn {
  authState: AuthState;
  authenticate: (credentials: InformaticaAuthCredentials) => Promise<boolean>;
  reset: () => void;
}

export function useInformaticaAuth(): UseInformaticaAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticating: false,
    error: null,
    session: null,
    token: null,
  });
  const { isMockAuthEnabled, getMockCredentials } = useMockAuth();

  // Check if mock auth is enabled on component mount
  useEffect(() => {
    if (isMockMode() && isMockAuthEnabled && getMockCredentials()) {
      const mockCredentials = getMockCredentials();
      if (mockCredentials) {
        // Create a fake session and token for the mock auth
        setAuthState({
          isAuthenticating: false,
          error: null,
          session: {
            sessionId: 'mock-session-id',
            orgId: 'mock-org-id',
            apiUrl: 'https://mock-api-url.com',
          },
          token: {
            token: 'mock-token-for-development',
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          },
        });
      }
    }
  }, [isMockAuthEnabled, getMockCredentials]);

  const authenticate = async (
    credentials: InformaticaAuthCredentials
  ): Promise<boolean> => {
    // If mock mode is enabled, return a successful mock authentication
    if (isMockMode() && isMockAuthEnabled) {
      console.log('Using mock authentication in development mode');

      setAuthState({
        isAuthenticating: false,
        error: null,
        session: {
          sessionId: 'mock-session-id',
          orgId: 'mock-org-id',
          apiUrl: credentials.apiUrl || 'https://mock-api-url.com',
        },
        token: {
          token: 'mock-token-for-development',
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        },
      });

      return true;
    }

    // Regular authentication flow
    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const authResult = await authenticateWithInformatica(credentials);

      setAuthState({
        isAuthenticating: false,
        error: null,
        session: authResult.session,
        token: authResult.token,
      });

      return true;
    } catch (error) {
      setAuthState({
        isAuthenticating: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        session: null,
        token: null,
      });

      return false;
    }
  };

  const reset = () => {
    setAuthState({
      isAuthenticating: false,
      error: null,
      session: null,
      token: null,
    });
  };

  return {
    authState,
    authenticate,
    reset,
  };
}
