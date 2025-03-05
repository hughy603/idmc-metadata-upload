import { useState } from 'react'
import { 
  AuthTokenInfo, 
  InformaticaAuthCredentials, 
  SessionInfo, 
  authenticateWithInformatica 
} from '../services/informatica-mapping-service'

export interface AuthState {
  isAuthenticating: boolean
  error: string | null
  session: SessionInfo | null
  token: AuthTokenInfo | null
}

export interface UseInformaticaAuthReturn {
  authState: AuthState
  authenticate: (credentials: InformaticaAuthCredentials) => Promise<boolean>
  reset: () => void
}

export function useInformaticaAuth(): UseInformaticaAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticating: false,
    error: null,
    session: null,
    token: null
  })

  const authenticate = async (credentials: InformaticaAuthCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isAuthenticating: true, error: null }))
    
    try {
      const authResult = await authenticateWithInformatica(credentials)
      
      setAuthState({
        isAuthenticating: false,
        error: null,
        session: authResult.session,
        token: authResult.token
      })
      
      return true
    } catch (error) {
      setAuthState({
        isAuthenticating: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        session: null,
        token: null
      })
      
      return false
    }
  }

  const reset = () => {
    setAuthState({
      isAuthenticating: false,
      error: null,
      session: null,
      token: null
    })
  }

  return {
    authState,
    authenticate,
    reset
  }
} 