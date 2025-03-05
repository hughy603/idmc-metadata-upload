import { NextRequest, NextResponse } from 'next/server';

import { authenticate } from '@/lib/services/token-service';

interface InformaticaAuthCredentials {
  username: string;
  password: string;
  baseUrl?: string;
  apiUrl?: string;
}

/**
 * API route for refreshing an authentication token
 *
 * @param request The incoming request
 * @returns A response with the refreshed token
 */
export async function POST(request: NextRequest): Promise<Response> {
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

    // Authenticate with the provided credentials
    const result = await authenticate(credentials)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
