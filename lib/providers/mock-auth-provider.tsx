'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

type MockAuthContextType = {
  isMockAuthEnabled: boolean;
  enableMockAuth: (credentials: { username: string; password: string }) => void;
  disableMockAuth: () => void;
  getMockCredentials: () => { username: string; password: string } | null;
};

const MockAuthContext = createContext<MockAuthContextType>({
  isMockAuthEnabled: false,
  enableMockAuth: () => {},
  disableMockAuth: () => {},
  getMockCredentials: () => null,
});

export const useMockAuth = (): MockAuthContextType =>
  useContext(MockAuthContext);

export function MockAuthProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [mockEnabled, setMockEnabled] = useState(false);
  const [mockCredentials, setMockCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  // Initialize mock auth state from localStorage on mount
  useEffect(() => {
    const storedMockEnabled = localStorage.getItem('mockAuthEnabled') === 'true';
    const storedUsername = localStorage.getItem('mockUsername');
    const storedPassword = localStorage.getItem('mockPassword');

    if (storedMockEnabled && storedUsername && storedPassword) {
      setMockEnabled(true);
      setMockCredentials({
        username: storedUsername,
        password: storedPassword,
      });
    }
  }, []);

  // Enable mock authentication with provided credentials
  const enableMockAuth = (credentials: {
    username: string;
    password: string;
  }) => {
    setMockCredentials(credentials);
    setMockEnabled(true);
    localStorage.setItem('mockAuthEnabled', 'true');
    localStorage.setItem('mockUsername', credentials.username);
    localStorage.setItem('mockPassword', credentials.password);
  };

  // Disable mock authentication
  const disableMockAuth = () => {
    setMockEnabled(false);
    setMockCredentials(null);
    localStorage.removeItem('mockAuthEnabled');
    localStorage.removeItem('mockUsername');
    localStorage.removeItem('mockPassword');
  };

  // Get the current mock credentials
  const getMockCredentials = () => {
    return mockCredentials;
  };

  return (
    <MockAuthContext.Provider
      value={{
        isMockAuthEnabled: mockEnabled,
        enableMockAuth,
        disableMockAuth,
        getMockCredentials,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
}
