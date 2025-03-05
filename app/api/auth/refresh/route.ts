import { NextRequest, NextResponse } from 'next/server'

import { refreshTokenIfNeeded } from '@/lib/services/auth-service'
import { InformaticaAuthCredentials } from '@/lib/services/informatica-mapping-service'

/**
 * API route for refreshing an authentication token
 *
 * @param request The incoming request
 * @returns A response with the refreshed token
 */
export async function POST(request: NextRequest) {
  try {
    // Get credentials from request body
    const body = await request.json()

    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const credentials: InformaticaAuthCredentials = {
      username: body.username,
      password: body.password,
      baseUrl: body.baseUrl || 'https://dm-us.informaticacloud.com',
      apiUrl: body.apiUrl || 'https://idmc-api.dm-us.informaticacloud.com',
    }

    // Refresh token if needed
    const token = await refreshTokenIfNeeded(credentials)

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 401 }
      )
    }

    // Return token and expiration
    return NextResponse.json({
      accessToken: token.accessToken,
      expiresAt: token.expiresAt,
    })
  } catch (error) {
    console.error('Token refresh error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Token refresh failed',
      },
      { status: 401 }
    )
  }
}
