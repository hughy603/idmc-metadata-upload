'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { InformaticaAuthCredentials } from '@/lib/services/informatica-mapping-service'

// Map of regions to base URLs and API URLs
export const REGION_URLS: Record<string, { baseUrl: string; apiUrl: string }> = {
  'us': { 
    baseUrl: 'https://dm-us.informaticacloud.com', 
    apiUrl: 'https://idmc-api.dm-us.informaticacloud.com' 
  },
  'emea': { 
    baseUrl: 'https://dm-em.informaticacloud.com', 
    apiUrl: 'https://idmc-api.dm-em.informaticacloud.com' 
  },
  'apj': { 
    baseUrl: 'https://dm-ap.informaticacloud.com', 
    apiUrl: 'https://idmc-api.dm-ap.informaticacloud.com' 
  },
  'canada': { 
    baseUrl: 'https://dm-na.informaticacloud.com', 
    apiUrl: 'https://idmc-api.dm-na.informaticacloud.com' 
  },
  'uk': { 
    baseUrl: 'https://dm-uk.informaticacloud.com', 
    apiUrl: 'https://idmc-api.dm-uk.informaticacloud.com' 
  }
}

const authFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
  region: z.enum(['us', 'emea', 'apj', 'canada', 'uk'], { 
    message: 'Please select a valid region' 
  })
})

export type AuthFormValues = z.infer<typeof authFormSchema>

interface AuthFormProps {
  isLoading: boolean
  error: string | null
  onSubmit: (credentials: InformaticaAuthCredentials) => Promise<void>
  onOAuthLogin: () => Promise<void>
}

export default function AuthForm({ isLoading, error, onSubmit, onOAuthLogin }: AuthFormProps) {
  const [authMethod, setAuthMethod] = useState<'credentials' | 'oauth'>('credentials')
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      username: '',
      password: '',
      region: 'us'
    }
  })

  const handleFormSubmit = async (data: AuthFormValues) => {
    const credentials: InformaticaAuthCredentials = {
      username: data.username,
      password: data.password,
      baseUrl: REGION_URLS[data.region].baseUrl,
      apiUrl: REGION_URLS[data.region].apiUrl
    }
    
    await onSubmit(credentials)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <button
              type="button"
              onClick={() => setAuthMethod('credentials')}
              className={`w-full py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                authMethod === 'credentials'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
                  : 'border-gray-300 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              Username & Password
            </button>
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={() => setAuthMethod('oauth')}
              className={`w-full py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                authMethod === 'oauth'
                  ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
                  : 'border-gray-300 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              OAuth
            </button>
          </div>
        </div>
        
        {authMethod === 'credentials' ? (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register('username')}
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Region
              </label>
              <select
                id="region"
                {...register('region')}
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="us">United States</option>
                <option value="emea">Europe/Middle East/Africa</option>
                <option value="apj">Asia Pacific/Japan</option>
                <option value="canada">Canada</option>
                <option value="uk">United Kingdom</option>
              </select>
              {errors.region && (
                <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Log in with your Informatica Cloud Single Sign-On provider.
            </p>
            <button
              onClick={onOAuthLogin}
              disabled={isLoading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Connecting...' : 'Connect with OAuth'}
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
          {error}
        </div>
      )}
    </div>
  )
} 