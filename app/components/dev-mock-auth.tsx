import { useState } from 'react';

import { useMockAuth } from '@/lib/providers/mock-auth-provider';
'use client'


/**
 * Development-only component for enabling mock authentication
 * This component only appears in development mode
 */
export default function DevMockAuth(): JSX.Element {
  const { isMockAuthEnabled, enableMockAuth, disableMockAuth } = useMockAuth()
  const [username, setUsername] = useState('test.user@example.com')
  const [password, setPassword] = useState('password123')
  const [isOpen, setIsOpen] = useState(false)

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const handleEnableMock = () => {
    enableMockAuth({ username, password })
    setIsOpen(false)
  }

  if (!isOpen && !isMockAuthEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={(error) => setIsOpen(true)}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-purple-700"
        >
          Enable Mock Auth
        </button>
      </div>
    )
  }

  if (!isOpen && isMockAuthEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2">
        <span className="rounded-md bg-green-100 px-3 py-1 text-xs text-green-800">
          Mock Auth Enabled
        </span>
        <button
          onClick={disableMockAuth}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-md hover:bg-red-700"
        >
          Disable
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 m-4 w-80 rounded-lg border border-gray-300 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Development Mock Auth
        </h3>
        <button
          onClick={(e) => setIsOpen(false)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="mock-username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Mock Username
          </label>
          <input
            id="mock-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="mock-password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Mock Password
          </label>
          <input
            id="mock-password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => setIsOpen(false)}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleEnableMock}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Enable Mock Auth
          </button>
        </div>
      </div>
    </div>
  )
}
